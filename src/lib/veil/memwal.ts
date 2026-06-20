import {
  createMemWalFromEnv,
  WalrusReporter,
} from "../../../packages/walrus-reporter/src/index.ts";

/** Live MemWal staging relayer — requires MEMWAL_* env (see docs.memwal.ai). */
export async function createWalrusReporter() {
  const memwal = await createMemWalFromEnv();
  return new WalrusReporter({ memwal });
}
