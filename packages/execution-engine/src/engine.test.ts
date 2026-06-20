import { describe, expect, it } from "vitest";
import { detectArbitrage } from "./arb.js";
import { kellyFraction, kellySize } from "./kelly.js";
import { generateSliceSchedule } from "./slices.js";
import { sviBackSolve } from "./svi.js";
import { planBearVault, simulateBearVault } from "./modes/bear.js";
import { priceParlay } from "./modes/parlay.js";

describe("sviBackSolve", () => {
  it("returns ~0.5 for ATM with symmetric params", () => {
    const p = sviBackSolve(
      { a: 0.04, b: 0.1, rho: -0.3, m: 0, sigma: 0.2, t: 1 },
      100,
      100,
      7 / 365,
    );
    expect(p).toBeGreaterThan(0.45);
    expect(p).toBeLessThan(0.55);
  });
});

describe("kellySize", () => {
  it("returns zero when conviction equals implied", () => {
    expect(kellySize(0.5, 0.5, 10_000, 1)).toBe(0);
  });

  it("returns positive stake with edge", () => {
    const stake = kellySize(0.65, 0.52, 10_000, 0.92);
    expect(stake).toBeGreaterThan(0);
    expect(stake).toBeLessThanOrEqual(2500);
  });
});

describe("kellyFraction edge", () => {
  it("p=0.5 yields zero bet", () => {
    expect(kellyFraction(0.5, 1)).toBe(0);
  });
});

describe("generateSliceSchedule", () => {
  it("applies jitter via injected random", () => {
    let i = 0;
    const seq = [0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0.5];
    const slices = generateSliceSchedule({
      totalSize: 10_000,
      numSlices: 5,
      currentVol: 0.4,
      random: () => seq[i++ % seq.length]!,
    });
    expect(slices).toHaveLength(5);
    expect(slices[0]!.jitterMs).not.toBe(slices[1]!.jitterMs);
  });
});

describe("detectArbitrage", () => {
  it("flags 16 point gap", () => {
    const r = detectArbitrage(0.51, 0.67, 0.1);
    expect(r.arbDetected).toBe(true);
    expect(r.gapPct).toBeCloseTo(16, 0);
  });
});

describe("bearModeVault", () => {
  it("returns three scenarios", () => {
    const table = simulateBearVault({ balance: 10_000, currentPrice: 100_000 });
    expect(table).toHaveLength(3);
    expect(table.map((r) => r.scenario)).toEqual(["bull", "flat", "bear"]);
  });

  it("plans position sizes", () => {
    const plan = planBearVault(10_000);
    expect(plan.plpSupply).toBe(6000);
    expect(plan.tailHedgeSize).toBe(1000);
  });
});

describe("parlay", () => {
  it("prices correlated parlay", () => {
    const leg = {
      asset: "BTC",
      strike: 110_000,
      forward: 105_000,
      svi: { a: 0.04, b: 0.1, rho: -0.3, m: 0, sigma: 0.42, t: 1 },
      timeHorizonHours: 168,
    };
    const plan = priceParlay([leg, { ...leg, asset: "ETH", strike: 4000 }], 0.55, 0.85, 10_000);
    expect(plan.marketProb).toBeGreaterThan(0);
    expect(plan.warnLowCorrelation).toBe(false);
  });
});
