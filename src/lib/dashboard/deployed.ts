import type { Order } from "./types";

/** dUSDC actually minted / supplied on-chain (cost basis). */
export function orderDeployedUsd(o: Order): number {
  return o.costBasisUsd ?? o.sizeUsdc ?? 0;
}

/** Intent notional the user typed (may exceed deployed for Kelly + TWAP). */
export function orderIntentUsd(o: Order): number {
  return o.sizeUsdc ?? o.costBasisUsd ?? 0;
}

export function formatDeployedVsIntent(o: Order): string | null {
  const deployed = orderDeployedUsd(o);
  const intent = orderIntentUsd(o);
  if (intent <= 0 || deployed <= 0) return null;
  if (Math.abs(intent - deployed) < 0.01) return `${deployed.toFixed(2)} dUSDC`;
  return `${deployed.toFixed(2)} of ${intent.toFixed(0)} dUSDC intent`;
}
