export interface SliceRecord {
  executionId: string;
  sliceNumber: number;
  direction: string;
  sizeUsdc: number;
  fillPrice: number;
  volAtExecution: number;
  timestamp: number;
  txDigest?: string;
}

export interface SummaryRecord {
  executionId: string;
  vwapAchieved: number;
  benchmarkVwap: number;
  marketImpactBps: number;
  executionQualityScore: number;
  attestationObjectId: string;
  totalFills: number;
  executionDurationMinutes: number;
  mode: string;
}

export interface MemWalAdapter {
  remember(payload: string): Promise<{ jobId: string }>;
  waitForJob(jobId: string): Promise<void>;
  recall(query: string): Promise<{ results: string[] }>;
}

export interface WalrusReporterConfig {
  memwal: MemWalAdapter;
  reportBaseUrl?: string;
}

export class WalrusReporter {
  constructor(private readonly config: WalrusReporterConfig) {}

  async writeSlice(executionId: string, slice: Omit<SliceRecord, "executionId">): Promise<void> {
    const payload: SliceRecord = { executionId, ...slice };
    const job = await this.config.memwal.remember(
      JSON.stringify({ type: "veil_slice", ...payload }),
    );
    await this.config.memwal.waitForJob(job.jobId);
  }

  async writeSummary(
    executionId: string,
    summary: Omit<SummaryRecord, "executionId">,
  ): Promise<void> {
    const payload: SummaryRecord = { executionId, ...summary };
    const job = await this.config.memwal.remember(
      JSON.stringify({ type: "veil_summary", ...payload }),
    );
    await this.config.memwal.waitForJob(job.jobId);
  }

  async getHistory(userAddress: string): Promise<string[]> {
    const result = await this.config.memwal.recall(`veil executions for ${userAddress}`);
    return result.results;
  }

  getReportUrl(executionId: string, userAddress?: string): string {
    const base = this.config.reportBaseUrl ?? "https://walrus.site/veil-report";
    const addr = userAddress ?? "unknown";
    return `${base}/${addr}?execution=${executionId}`;
  }
}

/** Create adapter from @mysten-incubation/memwal when credentials are configured */
export function createMemWalAdapter(memwal: {
  remember: (s: string) => Promise<{ job_id: string }>;
  waitForRememberJob: (id: string) => Promise<unknown>;
  recall: (q: { query: string }) => Promise<{ results: unknown[] }>;
}): MemWalAdapter {
  return {
    async remember(payload: string) {
      const job = await memwal.remember(payload);
      return { jobId: job.job_id };
    },
    async waitForJob(jobId: string) {
      await memwal.waitForRememberJob(jobId);
    },
    async recall(query: string) {
      const r = await memwal.recall({ query });
      return {
        results: r.results.map((x) => (typeof x === "string" ? x : JSON.stringify(x))),
      };
    },
  };
}

/** In-memory adapter for tests and CI without MemWal credentials */
export function createMemoryMemWalAdapter(): MemWalAdapter & { store: string[] } {
  const store: string[] = [];
  return {
    store,
    async remember(payload: string) {
      store.push(payload);
      return { jobId: `mem-${store.length}` };
    },
    async waitForJob() {},
    async recall(query: string) {
      const q = query.toLowerCase();
      return {
        results: store.filter((s) => s.toLowerCase().includes(q.slice(0, 8))),
      };
    },
  };
}

export interface MemWalEnvConfig {
  delegateKey: string;
  accountId: string;
  serverUrl?: string;
  namespace?: string;
}

/** Live MemWal via @mysten-incubation/memwal staging relayer (docs.memwal.ai) */
export async function createMemWalFromEnv(
  config?: Partial<MemWalEnvConfig>,
): Promise<MemWalAdapter> {
  const { requireMemWalEnv } = await import("../../sdk/src/live-env.ts");
  const env = requireMemWalEnv();
  const key = config?.delegateKey ?? env.delegateKey;
  const accountId = config?.accountId ?? env.accountId;

  if (!key || !accountId) {
    throw new Error("MEMWAL_DELEGATE_KEY and MEMWAL_ACCOUNT_ID required");
  }

  const { MemWal } = await import("@mysten-incubation/memwal");
  const memwal = MemWal.create({
    key,
    accountId,
    serverUrl:
      config?.serverUrl ??
      process.env.MEMWAL_SERVER_URL ??
      "https://relayer-staging.memory.walrus.xyz",
    namespace: config?.namespace ?? "veil-executions",
  });
  return createMemWalAdapter(memwal);
}
