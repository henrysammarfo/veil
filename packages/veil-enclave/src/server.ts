import { createHash, createHmac, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  deriveEnclaveSigningKey,
  signExecutionAttestation,
  toHexBytes,
} from "../../sdk/src/execution-digest.ts";
import {
  detectArbitrage,
  fetchPolymarketProb,
  planBullExecution,
  planBearVault,
  priceParlay,
  simulateBearVault,
  type VeilOrder,
} from "../../execution-engine/src/index.ts";
import {
  createMemWalFromEnv,
  WalrusReporter,
  type MemWalAdapter,
} from "../../walrus-reporter/src/index.ts";
import { createPredictExecutorFromEnv } from "../../sdk/src/predict-executor.ts";
import {
  assertOracleFresh,
  fetchLiveMarketContext,
  resolveMintStrike,
} from "../../sdk/src/predict-market.ts";
import {
  bearVaultOnChain,
  earnSupplyIdle,
  onChainVwap,
  parlayMintsOnChain,
} from "../../sdk/src/enclave-chain.ts";
import { executeBullTwapOnChain, bullPlanOnlySummary } from "../../sdk/src/twap-onchain.ts";
import { parseIntentWithLlm } from "../../sdk/src/intent-llm.ts";
import { requireEnv } from "../../sdk/src/live-env.ts";
import { sealDecrypt, sealEncrypt } from "./seal.ts";
import { buildNitroAttestation, isNsmAvailable } from "./nitro-attestation.ts";

export interface EnclaveConfig {
  port: number;
  enclaveId: string;
  devMode: boolean;
}

const ENCLAVE_SECRET = process.env.VEIL_ENCLAVE_SECRET ?? "veil-dev-enclave-secret";
const enclaveId = createHash("sha256").update(ENCLAVE_SECRET).digest("hex");
const enclaveSigning = deriveEnclaveSigningKey(ENCLAVE_SECRET);
const enclaveIdBytes = new TextEncoder().encode(enclaveId);

const sealState = new Map<string, string>();
let memwal: MemWalAdapter;
let reporter: WalrusReporter;
const predictExecutor = createPredictExecutorFromEnv();
let servicesReady: Promise<void>;

async function initServices() {
  memwal = await createMemWalFromEnv();
  reporter = new WalrusReporter({ memwal });
}

servicesReady = initServices();

async function whenReady() {
  await servicesReady;
}

async function resolveLiveMarket() {
  const oracleId = requireEnv("PREDICT_ORACLE_ID");
  const live = await fetchLiveMarketContext(oracleId);
  assertOracleFresh(live);
  return live;
}

function verifyAttestationPayload(payload: string, signature: string): boolean {
  try {
    const obj = JSON.parse(payload) as Record<string, unknown>;
    return signAttestation(obj) === signature;
  } catch {
    return false;
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function signAttestation(payload: object): string {
  const body = JSON.stringify(payload);
  return createHmac("sha256", ENCLAVE_SECRET).update(body).digest("base64");
}

function modeToNum(mode: VeilOrder["mode"]): number {
  return { BULL: 1, BEAR: 2, EARN: 3, PARLAY: 4 }[mode];
}

function withOnChainAttestation(
  result: Record<string, unknown>,
  order: VeilOrder,
  vwap: number,
  impactBps: number,
  fills: number,
  blobId: string,
  extra?: Record<string, unknown>,
) {
  const base = extra ? { ...result, ...extra } : result;
  if (!order.traderAddress) return base;
  const chain = signExecutionAttestation(ENCLAVE_SECRET, {
    trader: order.traderAddress,
    mode: modeToNum(order.mode),
    vwap: BigInt(onChainVwap(vwap)),
    impactBps: BigInt(Math.round(impactBps)),
    fills,
    blobId: new TextEncoder().encode(blobId),
    enclaveId: enclaveIdBytes,
  });
  return {
    ...base,
    onChainAttestation: {
      digest: toHexBytes(chain.digest),
      signature: toHexBytes(chain.signature),
      publicKey: toHexBytes(chain.publicKey),
      mode: modeToNum(order.mode),
      vwap: onChainVwap(vwap),
      impactBps,
      fills,
      blobId,
      enclaveId,
    },
    attestationHash: toHexBytes(chain.digest),
    recordProofParams: {
      packageId: process.env.VEIL_PACKAGE_ID,
      registryId: process.env.VEIL_REGISTRY_ID,
      mode: modeToNum(order.mode),
      vwap: onChainVwap(vwap),
      impactBps,
      fills,
      blobId,
      enclaveId,
    },
  };
}

function resolvePcrFromEnv(envKey: string, legacySeed: string): string | null {
  const fromEnv = process.env[envKey];
  if (!fromEnv) return null;
  return fromEnv.replace(/^0x/i, "");
}

async function buildAttestationResponse() {
  const pubBytes = enclaveSigning.publicKey;
  const pub = toHexBytes(pubBytes);

  const nitro = await buildNitroAttestation(pubBytes);
  if (nitro) {
    return {
      enclaveId,
      ...nitro,
    };
  }

  const pcr0 = resolvePcrFromEnv("VEIL_PCR0", "veil-pcr0");
  const pcr1 = resolvePcrFromEnv("VEIL_PCR1", "veil-pcr1");
  const pcr2 = resolvePcrFromEnv("VEIL_PCR2", "veil-pcr2");
  if (pcr0 && pcr1 && pcr2) {
    return {
      enclaveId,
      publicKey: pub,
      pcr0,
      pcr1,
      pcr2,
      attestationSource: "env" as const,
      nsmAvailable: isNsmAvailable(),
    };
  }

  return null;
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleExecute(order: VeilOrder) {
  await whenReady();
  const executionId = randomBytes(16).toString("hex");
  const live = await resolveLiveMarket();
  const { forwardUsd, svi } = live;
  const strikeUsd = order.strike ?? Math.round(forwardUsd);
  const managerId = order.managerId ?? process.env.PREDICT_MANAGER_ID;
  const oracleId = process.env.PREDICT_ORACLE_ID;
  const plpRecipient = order.traderAddress ?? predictExecutor.address;
  const txDigests: string[] = [];
  const chainMeta = { oracleId, oracleIds: oracleId ? [oracleId] : [] };

  if (order.mode === "BEAR") {
    const plan = planBearVault(order.sizeUsdc);
    const simulation = simulateBearVault({ balance: order.sizeUsdc, currentPrice: forwardUsd });
    let plpSupplyUsdc = 0;
    if (order.traderAddress && managerId && oracleId) {
      const bear = await bearVaultOnChain(predictExecutor, {
        managerId,
        oracleId,
        recipient: plpRecipient,
        sizeUsdc: order.sizeUsdc,
        forwardUsd,
      });
      txDigests.push(...bear.txDigests);
      plpSupplyUsdc = bear.plpSupplyUsdc;
    }
    const attestation = signAttestation({ executionId, mode: "BEAR", plan, simulation, plpSupplyUsdc });
    await reporter.writeSummary(executionId, {
      vwapAchieved: forwardUsd,
      benchmarkVwap: forwardUsd,
      marketImpactBps: 0,
      executionQualityScore: 90,
      attestationObjectId: executionId,
      totalFills: 3,
      executionDurationMinutes: 1,
      mode: "BEAR",
    });
    return withOnChainAttestation(
      {
        executionId,
        mode: order.mode,
        plan,
        simulation,
        plpSupplyUsdc,
        attestationPayload: attestation,
        enclaveId,
        txDigests,
        ...chainMeta,
      },
      order,
      forwardUsd,
      0,
      3,
      executionId,
    );
  }

  if (order.mode === "EARN") {
    let suppliedUsdc = 0;
    if (managerId) {
      const earn = await earnSupplyIdle(
        predictExecutor,
        managerId,
        plpRecipient,
        Math.max(order.sizeUsdc, 10),
      );
      if (earn.digest) txDigests.push(earn.digest);
      suppliedUsdc = earn.suppliedUsdc;
    }
    const attestation = signAttestation({ executionId, mode: "EARN", suppliedUsdc, compounded: true });
    await reporter.writeSummary(executionId, {
      vwapAchieved: suppliedUsdc || forwardUsd,
      benchmarkVwap: forwardUsd,
      marketImpactBps: 0,
      executionQualityScore: 92,
      attestationObjectId: executionId,
      totalFills: 1,
      executionDurationMinutes: 1,
      mode: "EARN",
    });
    return withOnChainAttestation(
      {
        executionId,
        mode: order.mode,
        suppliedUsdc,
        attestationPayload: attestation,
        enclaveId,
        txDigests,
        ...chainMeta,
      },
      order,
      suppliedUsdc || forwardUsd,
      0,
      1,
      executionId,
    );
  }

  if (order.mode === "PARLAY") {
    const leg = {
      asset: order.asset,
      strike: strikeUsd,
      forward: forwardUsd,
      svi,
      timeHorizonHours: order.timeHorizonHours,
    };
    const parlay = priceParlay(
      [leg, { ...leg, asset: "ETH", strike: strikeUsd * 0.04, forward: forwardUsd * 0.04 }],
      order.userConvictionPct / 100,
      0.85,
      order.sizeUsdc,
    );
    if (order.traderAddress && managerId && oracleId) {
      try {
        txDigests.push(
          ...(await parlayMintsOnChain(predictExecutor, {
            managerId,
            btcOracleId: oracleId,
            strikeUsd,
            forwardUsd,
          })),
        );
      } catch (e) {
        console.warn("parlay mints:", e instanceof Error ? e.message : e);
      }
    }
    const attestation = signAttestation({ executionId, mode: "PARLAY", parlay });
    return withOnChainAttestation(
      {
        executionId,
        mode: order.mode,
        parlay,
        attestationPayload: attestation,
        enclaveId,
        txDigests,
        ...chainMeta,
        parlayRecordParams: {
          convictionBps: Math.round(order.userConvictionPct * 100),
          marketProbBps: Math.round(parlay.marketProb * 10_000),
          correlationBps: Math.round(parlay.correlation * 10_000),
          legCount: 2,
        },
      },
      order,
      strikeUsd,
      0,
      2,
      executionId,
    );
  }

  const poly = await fetchPolymarketProb(order.asset, strikeUsd, "").catch(() => null);
  const plan = await planBullExecution({
    order,
    balance: order.sizeUsdc * 2,
    svi,
    strike: strikeUsd,
    forward: forwardUsd,
  });
  const arb = poly !== null ? detectArbitrage(plan.impliedProb, poly) : null;

  let summary;
  if (order.traderAddress && managerId && oracleId) {
    const twap = await executeBullTwapOnChain(predictExecutor, {
      order,
      schedule: plan.schedule,
      managerId,
      oracleId,
      strikeUsd: order.strike ?? strikeUsd,
    });
    txDigests.push(...twap.txDigests);
    summary = twap.summary;
  } else {
    summary = bullPlanOnlySummary(plan.stake, forwardUsd);
  }

  const attestation = signAttestation({
    executionId,
    enclaveId,
    algorithmHash: createHash("sha256").update("veil-bull-v1").digest("hex"),
    ...summary,
    arb,
  });

  for (const fill of summary.fills) {
    try {
      await reporter.writeSlice(executionId, {
        sliceNumber: fill.sliceNumber,
        direction: order.direction,
        sizeUsdc: fill.size,
        fillPrice: fill.price,
        volAtExecution: svi.sigma,
        timestamp: fill.timestamp,
        txDigest: fill.txDigest,
      });
    } catch (e) {
      console.warn("writeSlice:", e instanceof Error ? e.message : e);
    }
  }

  try {
    await reporter.writeSummary(executionId, {
      vwapAchieved: summary.vwap,
      benchmarkVwap: forwardUsd,
      marketImpactBps: summary.totalImpactBps,
      executionQualityScore: 94,
      attestationObjectId: executionId,
      totalFills: summary.sliceCount,
      executionDurationMinutes: 40,
      mode: "BULL",
    });
  } catch (e) {
    console.warn("writeSummary:", e instanceof Error ? e.message : e);
  }

  sealState.set(executionId, sealEncrypt(JSON.stringify({ order, summary }), ENCLAVE_SECRET));

  return withOnChainAttestation(
    {
      executionId,
      mode: order.mode,
      impliedProb: plan.impliedProb,
      stake: plan.stake,
      arb,
      ...summary,
      txDigests,
      executionMode: order.traderAddress && managerId ? "on_chain_twap" : "plan_only",
      attestationPayload: attestation,
      attestationHash: createHash("sha256").update(attestation).digest("hex"),
      enclaveId,
      reportUrl: reporter.getReportUrl(executionId),
      ...chainMeta,
    },
    order,
    summary.vwap,
    summary.totalImpactBps,
    summary.sliceCount,
    executionId,
  );
}

export function createEnclaveServer(config: Partial<EnclaveConfig> = {}) {
  const port = config.port ?? 8080;
  const server = createServer(async (req, res) => {
    try {
      await whenReady();
      if (req.url === "/health" && req.method === "GET") {
        return json(res, 200, { ok: true, enclaveId });
      }
      if (req.url === "/get_attestation" && req.method === "GET") {
        const att = await buildAttestationResponse();
        if (!att) {
          return json(res, 503, {
            error: "nitro_attestation_unavailable",
            message:
              "Real Nautilus PCR requires AWS Nitro Enclave (/dev/nsm). Deploy with packages/veil-enclave/Dockerfile.nitro + aws-nitro-deploy.sh, or set VEIL_PCR0/1/2 from nitro-cli describe-enclave.",
            nsmAvailable: isNsmAvailable(),
            docs: "https://docs.sui.io/sui-stack/nautilus/nautilus-design",
          });
        }
        return json(res, 200, att);
      }
      if (req.url === "/verify_attestation" && req.method === "POST") {
        const body = await readBody(req);
        const { payload, signature } = JSON.parse(body) as {
          payload: string;
          signature: string;
        };
        const valid = verifyAttestationPayload(payload, signature);
        return json(res, 200, { valid });
      }
      if (req.url === "/parse_intent" && req.method === "POST") {
        const body = await readBody(req);
        const { text } = JSON.parse(body) as { text?: string };
        const parsed = await parseIntentWithLlm(String(text ?? ""));
        return json(res, 200, parsed);
      }
      if (req.url === "/execute" && req.method === "POST") {
        const body = await readBody(req);
        const order = JSON.parse(body) as VeilOrder;
        const result = await handleExecute(order);
        return json(res, 200, result);
      }
      if (req.url === "/seal/restore" && req.method === "GET") {
        const id = new URL(req.url!, `http://localhost`).searchParams.get("id");
        const raw = id ? sealState.get(id) : null;
        const state = raw ? sealDecrypt(raw, ENCLAVE_SECRET) : null;
        return json(res, 200, { state });
      }
      if (req.url === "/seal/provision" && req.method === "POST") {
        const body = await readBody(req);
        const { key, value } = JSON.parse(body) as { key: string; value: string };
        sealState.set(key, sealEncrypt(value, ENCLAVE_SECRET));
        return json(res, 200, { ok: true, key });
      }
      json(res, 404, { error: "not found" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("enclave error:", msg);
      json(res, 500, { error: msg });
    }
  });
  return { server, port, enclaveId };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { server, port, enclaveId } = createEnclaveServer();
  server.listen(port, () =>
    console.log(`veil-enclave listening :${port} id=${enclaveId.slice(0, 16)}…`),
  );
}
