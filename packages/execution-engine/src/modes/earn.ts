export interface KeeperState {
  lastTickAt: number;
  redemptionsProcessed: number;
  compoundedUsdc: number;
  utilizationPct: number;
}

export interface SettledPosition {
  managerId: string;
  oracleId: string;
  redeemableUsdc: number;
}

export interface KeeperDeps {
  listSettledPositions: () => Promise<SettledPosition[]>;
  redeemPermissionless: (pos: SettledPosition) => Promise<string>;
  resupplyPlp: (amountUsdc: number) => Promise<string>;
  getVaultUtilization: () => Promise<number>;
  writeMemWalEvent: (event: Record<string, unknown>) => Promise<void>;
  randomDelayMs?: () => number;
}

const UTILIZATION_ALERT = 85;

export async function earnKeeperTick(deps: KeeperDeps): Promise<KeeperState> {
  const delay = deps.randomDelayMs?.() ?? Math.floor(Math.random() * 10_000) - 5000;
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  const positions = await deps.listSettledPositions();
  let compounded = 0;
  let count = 0;

  for (const pos of positions) {
    await deps.redeemPermissionless(pos);
    if (pos.redeemableUsdc > 0) {
      await deps.resupplyPlp(pos.redeemableUsdc);
      compounded += pos.redeemableUsdc;
    }
    count++;
    await deps.writeMemWalEvent({
      type: "keeper_redeem",
      managerId: pos.managerId,
      oracleId: pos.oracleId,
      amount: pos.redeemableUsdc,
      timestamp: Date.now(),
    });
  }

  const utilizationPct = await deps.getVaultUtilization();
  if (utilizationPct > UTILIZATION_ALERT) {
    await deps.writeMemWalEvent({
      type: "utilization_alert",
      utilizationPct,
      timestamp: Date.now(),
    });
  }

  return {
    lastTickAt: Date.now(),
    redemptionsProcessed: count,
    compoundedUsdc: compounded,
    utilizationPct,
  };
}

export function shouldSellCoveredRange(currentVol: number): boolean {
  if (currentVol > 0.65) return false;
  if (currentVol < 0.45) return true;
  return false;
}
