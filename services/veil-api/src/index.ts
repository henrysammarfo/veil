import "../../../packages/sdk/src/load-env.ts";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer } from "node:http";
import { EnokiClient } from "@mysten/enoki";
import {
  applyKeeperRedeemEvent,
  costBasisForOrder,
  syncOrdersWithPositions,
  type SettlementEvent,
} from "./settlement.ts";

const ENCLAVE_URL = process.env.VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080";
const PORT = Number(process.env.VEIL_API_PORT ?? 8787);
const STORE_PATH = process.env.VEIL_STORE_PATH ?? join(process.cwd(), "data", "veil-store.json");
const VEIL_PKG =
  process.env.VITE_VEIL_PACKAGE_ID ??
  "0xb4c09305a25340997cab3d5812383564b2a8c6e2e449b0818322034728aa4c33";
const SPONSOR_MAX = Number(process.env.ENOKI_SPONSOR_MAX ?? "1000");

const VEIL_SPONSOR_TARGETS = [
  `${VEIL_PKG}::execution_proof::record_execution`,
  `${VEIL_PKG}::execution_proof::record_parlay_execution`,
];

interface StoredOrder {
  order: Record<string, unknown>;
  execution: Record<string, unknown>;
  trader: string;
  createdAt: number;
}

interface UserPrefs {
  theme?: "dark" | "light";
  cockpitMode?: "lite" | "pro";
  onboardingSteps?: Record<string, boolean>;
  onboardingDismissed?: boolean;
  onboardingWizardDone?: boolean;
  archiveDensity?: "comfortable" | "compact";
  linkedWallet?: string;
  linkedEmail?: string;
  predictManagerId?: string;
  discoverPrivate?: boolean;
}

interface StoreFile {
  orders: StoredOrder[];
  prefs: Record<string, UserPrefs>;
  sponsorQuota: { used: number; max: number };
  settlements: import("./settlement.ts").SettlementEvent[];
  waitlist: WaitlistEntry[];
}

interface WaitlistEntry {
  email: string;
  wallet?: string;
  experience: "new" | "trader" | "power";
  createdAt: number;
  invited?: boolean;
}

function loadStore(): StoreFile {
  try {
    if (!existsSync(STORE_PATH)) {
      return { orders: [], prefs: {}, sponsorQuota: { used: 0, max: SPONSOR_MAX }, settlements: [], waitlist: [] };
    }
    const raw = JSON.parse(readFileSync(STORE_PATH, "utf8")) as Partial<StoreFile>;
    return {
      orders: raw.orders ?? [],
      prefs: raw.prefs ?? {},
      sponsorQuota: {
        used: raw.sponsorQuota?.used ?? 0,
        max: raw.sponsorQuota?.max ?? SPONSOR_MAX,
      },
      settlements: raw.settlements ?? [],
      waitlist: raw.waitlist ?? [],
    };
  } catch {
    return { orders: [], prefs: {}, sponsorQuota: { used: 0, max: SPONSOR_MAX }, settlements: [], waitlist: [] };
  }
}

function saveStore(store: StoreFile) {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

const store = loadStore();

const SETTLEMENT_SYNC_MS = Number(process.env.SETTLEMENT_SYNC_MS ?? 60_000);

async function runSettlementSync(managerOverride?: string): Promise<{ updated: number }> {
  const managerId = managerOverride ?? process.env.PREDICT_MANAGER_ID;
  if (!managerId) return { updated: 0 };
  const { fetchRedeemablePositions } = await import("../../../packages/sdk/src/predict-earn.ts");
  const positions = await fetchRedeemablePositions(managerId);
  const { updated, events } = syncOrdersWithPositions(store.orders, positions);
  if (events.length) {
    store.settlements.unshift(...events);
    store.settlements = store.settlements.slice(0, 1000);
    saveStore(store);
  }
  return { updated };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function clock() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function computePnl(
  mode: string,
  input: Record<string, unknown>,
  result: Record<string, unknown>,
): { pnl: string; pnlUsd: number; pnlKind: "realized" | "expected" | "neutral" } {
  const sizeUsdc = Number(input.sizeUsdc ?? 0);

  if (mode === "EARN") {
    const supplied = Number(result.suppliedUsdc ?? 0);
    const dailyYield = supplied * (0.15 / 365);
    const pct = sizeUsdc > 0 ? (dailyYield / sizeUsdc) * 100 : 0;
    return {
      pnl: supplied > 0 ? `+${pct.toFixed(3)}%` : "+0.00%",
      pnlUsd: Math.round(dailyYield * 100) / 100,
      pnlKind: supplied > 0 ? "expected" : "neutral",
    };
  }

  if (mode === "PARLAY") {
    const parlay = result.parlay as
      | { marketProb?: number; userConviction?: number; stake?: number }
      | undefined;
    if (parlay) {
      const edge = (parlay.userConviction ?? 0) - (parlay.marketProb ?? 0);
      const edgePct = edge * 100;
      const stake = parlay.stake ?? sizeUsdc;
      return {
        pnl: `${edgePct >= 0 ? "+" : ""}${edgePct.toFixed(2)}%`,
        pnlUsd: Math.round(stake * edge * 100) / 100,
        pnlKind: "expected",
      };
    }
  }

  if (mode === "BEAR") {
    const plan = result.plan as { expectedNetApy?: number } | undefined;
    const sim = result.simulation as { scenario?: string; netApy?: number; pnlUsdc?: number }[] | undefined;
    const flat = Array.isArray(sim) ? sim.find((s) => s.scenario === "flat") : undefined;
    const apy = flat?.netApy ?? (plan?.expectedNetApy ?? 0.17) * 100;
    const dailyUsd = (sizeUsdc * apy) / 100 / 365;
    return {
      pnl: `+${(apy / 365).toFixed(3)}%/d`,
      pnlUsd: Math.round(dailyUsd * 100) / 100,
      pnlKind: "expected",
    };
  }

  const arb = result.arb as { arbDetected?: boolean; gapPct?: number } | undefined;
  if (arb?.arbDetected && arb.gapPct) {
    const pnlUsd = (sizeUsdc * arb.gapPct) / 100;
    return {
      pnl: `+${arb.gapPct.toFixed(2)}%`,
      pnlUsd: Math.round(pnlUsd * 100) / 100,
      pnlKind: "expected",
    };
  }

  const impact = Number(result.totalImpactBps ?? result.marketImpactBps ?? 0);
  const impactPct = impact / 100;
  const pnlUsd = sizeUsdc > 0 ? -(sizeUsdc * impact) / 10_000 : 0;
  return {
    pnl: `${impactPct >= 0 ? "+" : ""}${impactPct.toFixed(2)}%`,
    pnlUsd: Math.round(pnlUsd * 100) / 100,
    pnlKind: impact === 0 ? "neutral" : "realized",
  };
}

function buildOrderFromExecution(
  trader: string,
  input: Record<string, unknown>,
  result: Record<string, unknown>,
): Record<string, unknown> {
  const mode = String(input.mode ?? "BULL");
  const horizonHours = Number(input.timeHorizonHours ?? 168);
  const plannedSlices = Math.max(3, Math.min(24, Math.round(horizonHours / 16)));
  const fillsArr = result.fills as unknown[] | undefined;
  const txDigests = result.txDigests as (string | null | undefined)[] | undefined;
  const totalFills = Number(
    result.totalFills ??
      (Array.isArray(fillsArr) ? fillsArr.length : 0) ??
      (Array.isArray(txDigests) ? txDigests.filter((d) => d && String(d).length > 8).length : 0),
  );
  const totalSlices = Math.max(
    plannedSlices,
    Number(result.sliceCount ?? 0),
    totalFills,
    Array.isArray(fillsArr) ? fillsArr.length : 0,
  );
  const onChain = String(result.executionMode ?? "").includes("on_chain") || totalFills > 0;
  const progress =
    totalSlices > 0
      ? Math.min(100, Math.round((totalFills / totalSlices) * 100))
      : onChain
        ? 5
        : 0;
  const { pnl, pnlUsd, pnlKind } = computePnl(mode, input, result);
  const costBasisUsd = costBasisForOrder(input, result);

  let state: string;
  if (mode === "EARN") {
    state = totalFills > 0 ? "ACCRUING" : onChain ? "PENDING" : "PENDING";
  } else if (totalFills >= totalSlices && totalFills > 0) {
    state = "SETTLED";
  } else if (totalFills > 0 || onChain) {
    state = "EXECUTING";
  } else {
    state = "PENDING";
  }

  return {
    id: String(result.executionId ?? `vl-${Date.now()}`),
    intent: String(input.intent ?? `${mode} order`),
    mode,
    state,
    progress,
    slices: { filled: totalFills, total: totalSlices },
    pnl,
    pnlUsd,
    pnlKind,
    expectedPnl: pnl,
    expectedPnlUsd: pnlUsd,
    costBasisUsd,
    stealth: true,
    asset: String(input.asset ?? "BTC"),
    wallet: trader,
    createdAt: Date.now(),
    sizeUsdc: Number(input.sizeUsdc ?? 0),
    attestationHash: result.attestationHash,
    enclaveId: result.enclaveId,
    reportUrl: result.reportUrl,
    txDigests: result.txDigests,
    payload: result,
  };
}

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function computeLeaders(rangeHours: number) {
  const since = Date.now() - rangeHours * 60 * 60 * 1000;
  const byTrader = new Map<
    string,
    { closed: number; wins: number; pnlUsd: number; volUsd: number }
  >();

  for (const row of store.orders) {
    const trader = row.trader;
    if (!trader || trader === "anonymous") continue;
    if (store.prefs[trader]?.discoverPrivate) continue;
    if (row.createdAt < since) continue;

    const order = row.order;
    const state = String(order.state ?? "");
    const progress = Number(order.progress ?? 0);
    const settled = state === "SETTLED" || progress >= 100;
    if (!settled) continue;

    const pnlUsd = Number(order.realizedPnlUsd ?? order.pnlUsd ?? 0);
    const sizeUsdc = Number(order.sizeUsdc ?? 0);
    const cur = byTrader.get(trader) ?? { closed: 0, wins: 0, pnlUsd: 0, volUsd: 0 };
    cur.closed += 1;
    if (pnlUsd > 0) cur.wins += 1;
    cur.pnlUsd += pnlUsd;
    cur.volUsd += sizeUsdc;
    byTrader.set(trader, cur);
  }

  return [...byTrader.entries()]
    .map(([addr, s]) => ({
      addr,
      shortAddr: shortAddr(addr),
      closed: s.closed,
      winrate: s.closed > 0 ? Math.round((s.wins / s.closed) * 100) : 0,
      pnl: `${s.pnlUsd >= 0 ? "+" : ""}${s.pnlUsd.toFixed(2)}`,
      pnlUsd: Math.round(s.pnlUsd * 100) / 100,
      vol: s.volUsd >= 1000 ? `$${(s.volUsd / 1000).toFixed(1)}k` : `$${Math.round(s.volUsd)}`,
    }))
    .sort((a, b) => b.pnlUsd - a.pnlUsd)
    .slice(0, 24);
}

function buildProof(
  order: Record<string, unknown>,
  result: Record<string, unknown>,
): Record<string, unknown> {
  const mode = String(order.mode ?? "BULL");
  const asset = String(order.asset ?? "BTC");
  const fills = Number((order.slices as { filled?: number } | undefined)?.filled ?? result.totalFills ?? 0);
  const tag = fills > 0 ? "ORDER" : "ATTEST";
  return {
    id: `proof-${order.id}`,
    t: clock(),
    tag,
    text: `${mode} ${asset} · ${fills} slice${fills === 1 ? "" : "s"} · attestation sealed`,
    hash: String(result.attestationHash ?? result.attestationPayload ?? "").slice(0, 66),
    orderId: order.id,
    pcr0: result.pcr0,
    enclave: result.enclaveId,
    txDigest: Array.isArray(result.txDigests) ? result.txDigests[0] : undefined,
    payload: result,
    createdAt: Date.now(),
  };
}

async function proxyEnclave(path: string, body?: unknown) {
  const res = await fetch(`${ENCLAVE_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`enclave ${res.status}`);
  return res.json();
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const send = (status: number, data: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };

  try {
    if (url.pathname === "/health") return send(200, { ok: true, enclave: ENCLAVE_URL });

    if (url.pathname === "/api/orders" && req.method === "GET") {
      const trader = url.searchParams.get("trader") ?? "";
      const list = store.orders
        .filter((r) => !trader || r.trader === trader)
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((r) => r.order);
      return send(200, list);
    }

    if (url.pathname.startsWith("/api/orders/") && req.method === "GET") {
      const id = url.pathname.split("/").pop()!;
      const trader = url.searchParams.get("trader") ?? "";
      const row = store.orders.find(
        (r) => String(r.order.id) === id && (!trader || r.trader === trader),
      );
      if (!row) return send(404, { error: "not found" });
      return send(200, { order: row.order, execution: row.execution });
    }

    if (url.pathname === "/api/intent/parse" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString()) as { text?: string };
      const text = String(body.text ?? "").trim();
      if (!text) return send(400, { error: "text required" });
      try {
        const parsed = (await proxyEnclave("/parse_intent", { text })) as Record<string, unknown>;
        return send(200, parsed);
      } catch {
        const { parseIntentWithLlm } = await import("../../../packages/sdk/src/intent-llm.js");
        return send(200, await parseIntentWithLlm(text));
      }
    }

    if (url.pathname === "/api/execute" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const order = JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>;
      const trader = String(order.trader ?? order.traderAddress ?? "");
      const enclaveOrder = {
        ...order,
        traderAddress: trader && trader !== "anonymous" ? trader : undefined,
      };
      const result = (await proxyEnclave("/execute", enclaveOrder)) as Record<string, unknown>;
      const built = buildOrderFromExecution(trader || "anonymous", order, result);
      store.orders.unshift({
        order: built,
        execution: result,
        trader,
        createdAt: Date.now(),
      });
      store.orders = store.orders.slice(0, 500);
      saveStore(store);
      return send(200, { ...result, order: built });
    }

    if (url.pathname === "/api/proofs") {
      const trader = url.searchParams.get("trader") ?? "";
      const orderId = url.searchParams.get("orderId");
      const proofs = store.orders
        .filter((r) => !trader || r.trader === trader)
        .map((r) => buildProof(r.order, r.execution))
        .filter((p) => !orderId || p.orderId === orderId);
      return send(200, proofs);
    }

    if (url.pathname === "/api/verify" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        attestationHash?: string;
        attestationPayload?: string;
        payload?: string;
        signature?: string;
      };

      const hash = body.attestationHash;
      if (hash) {
        const match = store.orders.some(
          (r) =>
            String(r.execution.attestationHash ?? "") === hash ||
            String(r.execution.attestationPayload ?? "").includes(hash.slice(2, 10)),
        );
        if (match) return send(200, { valid: true, source: "store" });
      }

      if (body.payload && body.signature) {
        const enclaveRes = await fetch(`${ENCLAVE_URL}/verify_attestation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: body.payload, signature: body.signature }),
        });
        if (enclaveRes.ok) {
          const data = (await enclaveRes.json()) as { valid: boolean };
          return send(200, { valid: data.valid, source: "enclave" });
        }
      }

      if (hash && hash.length >= 32) {
        return send(200, { valid: false, source: "unknown" });
      }
      return send(200, { valid: false });
    }

    if (url.pathname === "/api/manager" && req.method === "GET") {
      const owner = url.searchParams.get("owner") ?? "";
      if (!owner) return send(400, { error: "owner required" });
      const cached = store.prefs[owner]?.predictManagerId;
      const { fetchManagerForOwner, fetchManagerSummary } = await import(
        "../../../packages/sdk/src/predict-market.js"
      );
      const managerId = cached ?? (await fetchManagerForOwner(owner));
      if (!managerId) return send(200, { managerId: null, balanceUsdc: 0, openPositions: 0 });
      const summary = await fetchManagerSummary(managerId);
      return send(200, {
        managerId,
        balanceUsdc: summary ? Number(summary.balanceMicro) / 1_000_000 : 0,
        openPositions: summary?.openPositions ?? 0,
        awaitingSettlement: summary?.awaitingSettlement ?? 0,
      });
    }

    if (url.pathname.startsWith("/api/manager/") && url.pathname.endsWith("/positions") && req.method === "GET") {
      const managerId = url.pathname.split("/")[3];
      if (!managerId) return send(400, { error: "managerId required" });
      const { fetchRedeemablePositions } = await import("../../../packages/sdk/src/predict-earn.js");
      const positions = await fetchRedeemablePositions(managerId);
      return send(200, positions);
    }

    if (url.pathname === "/api/prefs" && req.method === "GET") {
      const trader = url.searchParams.get("trader") ?? "";
      if (!trader) return send(200, {});
      return send(200, store.prefs[trader] ?? {});
    }

    if (url.pathname === "/api/prefs" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        trader: string;
      } & UserPrefs;
      const trader = String(body.trader ?? "");
      if (!trader) return send(400, { error: "trader required" });
      const prev = store.prefs[trader] ?? {};
      store.prefs[trader] = {
        ...prev,
        ...(body.theme !== undefined ? { theme: body.theme } : {}),
        ...(body.cockpitMode !== undefined ? { cockpitMode: body.cockpitMode } : {}),
        ...(body.onboardingSteps !== undefined ? { onboardingSteps: body.onboardingSteps } : {}),
        ...(body.onboardingDismissed !== undefined
          ? { onboardingDismissed: body.onboardingDismissed }
          : {}),
        ...(body.archiveDensity !== undefined ? { archiveDensity: body.archiveDensity } : {}),
        ...(body.linkedWallet !== undefined ? { linkedWallet: body.linkedWallet } : {}),
        ...(body.linkedEmail !== undefined ? { linkedEmail: body.linkedEmail } : {}),
        ...(body.predictManagerId !== undefined
          ? { predictManagerId: body.predictManagerId }
          : {}),
        ...(body.discoverPrivate !== undefined ? { discoverPrivate: body.discoverPrivate } : {}),
        ...(body.onboardingWizardDone !== undefined
          ? { onboardingWizardDone: body.onboardingWizardDone }
          : {}),
      };
      saveStore(store);
      return send(200, store.prefs[trader]);
    }

    if (url.pathname === "/api/leaders" && req.method === "GET") {
      const range = url.searchParams.get("range") ?? "6H";
      const hours = range === "1H" ? 1 : range === "24H" ? 24 : 6;
      const leaders = computeLeaders(hours);
      return send(200, { leaders, range, updatedAt: Date.now() });
    }

    if (url.pathname.startsWith("/api/traders/") && req.method === "GET") {
      const addr = decodeURIComponent(url.pathname.slice("/api/traders/".length));
      if (!addr) return send(400, { error: "address required" });
      if (store.prefs[addr]?.discoverPrivate) {
        return send(404, { error: "profile private" });
      }
      const rows = store.orders
        .filter((r) => r.trader === addr)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50);
      const closed = rows.filter((r) => String(r.order.state) === "SETTLED");
      const wins = closed.filter((r) => Number(r.order.realizedPnlUsd ?? r.order.pnlUsd ?? 0) > 0);
      const pnlUsd = closed.reduce(
        (s, r) => s + Number(r.order.realizedPnlUsd ?? r.order.pnlUsd ?? 0),
        0,
      );
      const volUsd = rows.reduce((s, r) => s + Number(r.order.sizeUsdc ?? 0), 0);
      return send(200, {
        addr,
        shortAddr: shortAddr(addr),
        closed: closed.length,
        winrate: closed.length ? Math.round((wins.length / closed.length) * 100) : 0,
        pnl: `${pnlUsd >= 0 ? "+" : ""}${pnlUsd.toFixed(2)}`,
        vol: volUsd >= 1000 ? `$${(volUsd / 1000).toFixed(1)}k` : `$${Math.round(volUsd)}`,
        orders: rows.map((r) => r.order),
      });
    }

    if (url.pathname === "/api/waitlist/count" && req.method === "GET") {
      return send(200, { count: store.waitlist.length });
    }

    if (url.pathname === "/api/waitlist" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        email?: string;
        wallet?: string;
        experience?: WaitlistEntry["experience"];
      };
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
      if (!email || !email.includes("@")) return send(400, { error: "valid email required" });
      const exists = store.waitlist.some((w) => w.email === email);
      if (!exists) {
        store.waitlist.unshift({
          email,
          wallet: body.wallet?.trim(),
          experience: body.experience ?? "new",
          createdAt: Date.now(),
        });
        store.waitlist = store.waitlist.slice(0, 10_000);
        saveStore(store);
      }
      return send(200, { ok: true, count: store.waitlist.length });
    }

    if (url.pathname === "/api/settlement/sync" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      let managerId: string | undefined;
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString()) as { managerId?: string };
        managerId = body.managerId;
      } catch {
        /* empty body ok */
      }
      const result = await runSettlementSync(managerId);
      return send(200, result);
    }

    if (url.pathname === "/api/settlement/event" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const event = JSON.parse(Buffer.concat(chunks).toString()) as SettlementEvent;
      const applied = applyKeeperRedeemEvent(store.orders, event);
      if (applied) {
        store.settlements.unshift({ ...event, type: "keeper_redeem", timestamp: Date.now() });
        store.settlements = store.settlements.slice(0, 1000);
        saveStore(store);
      }
      return send(200, { applied });
    }

    if (url.pathname === "/api/sponsor/quota" && req.method === "GET") {
      const { used, max } = store.sponsorQuota;
      return send(200, { used, max, remaining: Math.max(0, max - used) });
    }

    if (url.pathname === "/api/sponsor/create" && req.method === "POST") {
      const enokiKey = process.env.ENOKI_SECRET_KEY;
      if (!enokiKey) return send(503, { error: "ENOKI_SECRET_KEY not configured" });
      if (store.sponsorQuota.used >= store.sponsorQuota.max) {
        return send(429, {
          error: "Enoki sponsor quota exhausted",
          used: store.sponsorQuota.used,
          max: store.sponsorQuota.max,
        });
      }
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const { jwt, transactionKindBytes, network } = JSON.parse(
        Buffer.concat(chunks).toString(),
      ) as {
        jwt: string;
        transactionKindBytes: string;
        network?: "testnet" | "devnet";
      };
      const enoki = new EnokiClient({ apiKey: enokiKey });
      const sponsored = await enoki.createSponsoredTransaction({
        jwt,
        network: network ?? "testnet",
        transactionKindBytes,
        allowedMoveCallTargets: VEIL_SPONSOR_TARGETS,
      });
      return send(200, sponsored);
    }

    if (url.pathname === "/api/sponsor/execute" && req.method === "POST") {
      const enokiKey = process.env.ENOKI_SECRET_KEY;
      if (!enokiKey) return send(503, { error: "ENOKI_SECRET_KEY not configured" });
      if (store.sponsorQuota.used >= store.sponsorQuota.max) {
        return send(429, {
          error: "Enoki sponsor quota exhausted",
          used: store.sponsorQuota.used,
          max: store.sponsorQuota.max,
        });
      }
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const { digest, signature } = JSON.parse(Buffer.concat(chunks).toString()) as {
        digest: string;
        signature: string;
      };
      const enoki = new EnokiClient({ apiKey: enokiKey });
      const result = await enoki.executeSponsoredTransaction({ digest, signature });
      store.sponsorQuota.used += 1;
      saveStore(store);
      return send(200, {
        ...result,
        quota: {
          used: store.sponsorQuota.used,
          max: store.sponsorQuota.max,
          remaining: Math.max(0, store.sponsorQuota.max - store.sponsorQuota.used),
        },
      });
    }

    if (url.pathname === "/api/oracle/svi") {
      const { PredictServerClient } = await import("../../../packages/sdk/src/predict-client.ts");
      const client = new PredictServerClient();
      const svi = await client.fetchLiveSvi();
      return send(200, { svi });
    }

    if (url.pathname === "/api/arb") {
      const asset = url.searchParams.get("asset") ?? "btc";
      const strike = Number(url.searchParams.get("strike") ?? 0);
      const { fetchPolymarketProb, detectArbitrage, sviBackSolve } =
        await import("../../../packages/execution-engine/src/index.ts");
      const { fetchLiveMarketContext, predictPriceToUsd } =
        await import("../../../packages/sdk/src/predict-market.ts");
      const oracleId = process.env.PREDICT_ORACLE_ID;
      if (!oracleId) return send(503, { error: "PREDICT_ORACLE_ID not configured" });
      const live = await fetchLiveMarketContext(oracleId);
      const strikeUsd = strike > 0 ? strike : Math.round(live.forwardUsd);
      const timeYears = live.svi.t;
      const deepbook = sviBackSolve(live.svi, strikeUsd, live.forwardUsd, timeYears);
      const poly = await fetchPolymarketProb(asset, strikeUsd, "");
      const arb =
        poly !== null
          ? detectArbitrage(deepbook, poly)
          : { arbDetected: false, gapPct: 0, direction: "none" };
      return send(200, {
        polymarket: poly,
        deepbook,
        forwardUsd: live.forwardUsd,
        forwardFixed: live.forwardFixed,
        strikeUsd,
        updatedAtMs: live.svi.updatedAtMs,
        arb,
      });
    }

    send(404, { error: "not found" });
  } catch (e) {
    send(500, { error: e instanceof Error ? e.message : "error" });
  }
});

server.listen(PORT, () => {
  console.log(`veil-api :${PORT} → enclave ${ENCLAVE_URL} · store ${STORE_PATH}`);
  void runSettlementSync();
  setInterval(() => void runSettlementSync(), SETTLEMENT_SYNC_MS);
});
