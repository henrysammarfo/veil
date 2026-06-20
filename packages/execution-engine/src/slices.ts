export interface SliceSpec {
  size: number;
  delayMs: number;
  jitterMs: number;
  sliceNumber: number;
}

export interface SliceScheduleOptions {
  totalSize: number;
  numSlices: number;
  currentVol: number;
  baseDelayMs?: number;
  random?: () => number;
}

/**
 * Vol-surface timed TWAP with random jitter to defeat pattern recognition.
 */
export function generateSliceSchedule(opts: SliceScheduleOptions): SliceSpec[] {
  const { totalSize, numSlices, currentVol, baseDelayMs = 240_000, random = Math.random } = opts;

  const volHigh = currentVol > 0.6;
  const volLow = currentVol < 0.3;
  const sizeMult = volHigh ? 0.7 : volLow ? 1.3 : 1.0;
  const delayMult = volHigh ? 1.4 : volLow ? 0.75 : 1.0;

  const baseSlice = (totalSize / numSlices) * sizeMult;
  const slices: SliceSpec[] = [];

  for (let i = 0; i < numSlices; i++) {
    const jitterFactor = 0.8 + random() * 0.4;
    const size = baseSlice * jitterFactor;
    const delayMs = baseDelayMs * delayMult;
    const jitterMs = delayMs * 0.2 * (random() * 2 - 1);
    slices.push({
      size,
      delayMs,
      jitterMs,
      sliceNumber: i + 1,
    });
  }

  return slices;
}

export function computeVwap(fills: { price: number; size: number }[]): {
  vwap: number;
  totalImpactBps: number;
} {
  if (fills.length === 0) return { vwap: 0, totalImpactBps: 0 };
  let notional = 0;
  let qty = 0;
  for (const f of fills) {
    notional += f.price * f.size;
    qty += f.size;
  }
  const vwap = qty > 0 ? notional / qty : 0;
  const first = fills[0]!.price;
  const impactBps = first > 0 ? Math.abs((vwap - first) / first) * 10_000 : 0;
  return { vwap, totalImpactBps: impactBps };
}
