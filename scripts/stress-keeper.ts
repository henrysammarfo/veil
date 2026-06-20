#!/usr/bin/env npx tsx
import { earnKeeperTick } from "../packages/execution-engine/src/index.ts";
import { createMemoryMemWalAdapter } from "../packages/walrus-reporter/src/index.ts";

const N = 50;
const memwal = createMemoryMemWalAdapter();
const positions = Array.from({ length: N }, (_, i) => ({
  managerId: `mgr-${i}`,
  oracleId: `oracle-${i}`,
  redeemableUsdc: 100 + i,
}));

const start = Date.now();
const state = await earnKeeperTick({
  listSettledPositions: async () => positions,
  redeemPermissionless: async () => "tx",
  resupplyPlp: async () => "tx",
  getVaultUtilization: async () => 90,
  writeMemWalEvent: async (e) => {
    await memwal.remember(JSON.stringify(e));
  },
});
console.log({
  durationMs: Date.now() - start,
  redemptions: state.redemptionsProcessed,
  memwalWrites: memwal.store.length,
});
