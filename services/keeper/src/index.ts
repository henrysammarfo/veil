import "../../../packages/sdk/src/load-env.ts";
import { earnKeeperTick } from "../../../packages/execution-engine/src/index.ts";
import { createMemWalFromEnv, type MemWalAdapter } from "../../../packages/walrus-reporter/src/index.ts";
import { createPredictExecutorFromEnv } from "../../../packages/sdk/src/predict-executor.ts";
import {
  clampEarnSupplyUsdc,
  fetchRedeemablePositions,
  keeperResupplyChunk,
  redeemSettledPosition,
  supplyIdleToPlp,
} from "../../../packages/sdk/src/predict-earn.ts";
import { fetchVaultUtilizationPct } from "../../../packages/sdk/src/predict-market.ts";

const INTERVAL_MS = Number(process.env.KEEPER_INTERVAL_MS ?? 60_000);
const JITTER_MAX_MS = Number(process.env.KEEPER_MEV_JITTER_MS ?? 10_000);
const UTILIZATION_ALERT = 85;
const VEIL_API = process.env.VEIL_API_URL ?? "http://127.0.0.1:8787";

async function notifySettlement(event: Record<string, unknown>) {
  try {
    await fetch(`${VEIL_API}/api/settlement/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    console.warn("settlement notify:", e instanceof Error ? e.message : e);
  }
}

async function listManagerIds(): Promise<string[]> {
  const fallback = process.env.PREDICT_MANAGER_ID?.trim();
  try {
    const res = await fetch(`${VEIL_API}/api/settlement/managers`);
    if (res.ok) {
      const data = (await res.json()) as { managerIds?: string[] };
      const ids = data.managerIds ?? [];
      if (ids.length) return ids;
    }
  } catch (e) {
    console.warn("keeper managers fetch:", e instanceof Error ? e.message : e);
  }
  return fallback ? [fallback] : [];
}

let memwal: MemWalAdapter;
const executor = createPredictExecutorFromEnv();

async function init() {
  memwal = await createMemWalFromEnv();
  console.log(JSON.stringify({ keeper: "init", address: executor.address }));
}

async function keeperTickForManager(managerId: string) {
  return earnKeeperTick({
    listSettledPositions: async () => {
      const rows = await fetchRedeemablePositions(managerId);
      return rows.map((p) => ({
        managerId,
        oracleId: p.oracleId,
        redeemableUsdc: p.redeemableUsdc,
        expiry: p.expiry,
        strike: p.strike,
        isUp: p.isUp,
        quantity: p.openQuantity,
      }));
    },
    redeemPermissionless: async (pos) => {
      const rows = await fetchRedeemablePositions(managerId);
      const full = rows.find((r) => r.oracleId === pos.oracleId);
      if (!full) throw new Error(`no position for oracle ${pos.oracleId}`);
      const digest = await redeemSettledPosition(executor, full, managerId);
      await notifySettlement({
        type: "keeper_redeem",
        oracleId: pos.oracleId,
        redeemableUsdc: pos.redeemableUsdc,
        txDigest: digest,
        managerId,
        timestamp: Date.now(),
      });
      return digest;
    },
    resupplyPlp: async (amountUsdc) => {
      const util = await fetchVaultUtilizationPct();
      if (util > UTILIZATION_ALERT) {
        console.warn(JSON.stringify({ keeper: "skip_supply", util }));
        return "skipped-high-util";
      }
      const chunk = await clampEarnSupplyUsdc(managerId, keeperResupplyChunk(amountUsdc));
      if (chunk < 10) return "skipped-below-min";
      const digest = await supplyIdleToPlp(executor, {
        managerId,
        recipient: executor.address,
        amountUsdc: chunk,
      });
      return digest ?? "skipped";
    },
    getVaultUtilization: () => fetchVaultUtilizationPct(),
    writeMemWalEvent: async (event) => {
      await memwal.remember(JSON.stringify(event));
    },
    randomDelayMs: () => Math.floor(Math.random() * JITTER_MAX_MS) - JITTER_MAX_MS / 2,
  });
}

async function tick() {
  const managers = await listManagerIds();
  const summary = [];
  for (const managerId of managers) {
    try {
      const state = await keeperTickForManager(managerId);
      summary.push({ managerId: managerId.slice(0, 12), ...state });
    } catch (e) {
      console.warn(
        JSON.stringify({
          keeper: "manager_tick_failed",
          managerId: managerId.slice(0, 12),
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  }
  console.log(JSON.stringify({ keeper: "tick", managers: managers.length, summary, ts: Date.now() }));
}

void init().then(() => {
  console.log(`veil-keeper interval=${INTERVAL_MS}ms multi-manager`);
  void tick();
  setInterval(() => void tick(), INTERVAL_MS);
});
