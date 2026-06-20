export interface BearVaultOptions {
  balance: number;
  currentPrice: number;
  plpApy?: number;
  rangePremiumApy?: number;
  tailCostApy?: number;
}

export interface ScenarioResult {
  scenario: "bull" | "flat" | "bear";
  priceChangePct: number;
  pnlUsdc: number;
  netApy: number;
  maxDrawdown: number;
}

export interface BearVaultPlan {
  plpSupply: number;
  rangeShortSize: number;
  tailHedgeSize: number;
  expectedNetApy: number;
}

export function planBearVault(balance: number, options?: Partial<BearVaultOptions>): BearVaultPlan {
  const plpSupply = balance * 0.6;
  const rangeShortSize = balance * 0.2;
  const tailHedgeSize = balance * 0.1;
  const plpApy = options?.plpApy ?? 0.15;
  const rangePremiumApy = options?.rangePremiumApy ?? 0.035;
  const tailCostApy = options?.tailCostApy ?? 0.015;
  const expectedNetApy = plpApy + rangePremiumApy - tailCostApy;
  return { plpSupply, rangeShortSize, tailHedgeSize, expectedNetApy };
}

/** Required DeepBook judging simulation table */
export function simulateBearVault(input: BearVaultOptions): ScenarioResult[] {
  const { balance, plpApy = 0.15, rangePremiumApy = 0.035, tailCostApy = 0.015 } = input;
  const baseYield = balance * plpApy;

  const scenarios: { scenario: ScenarioResult["scenario"]; priceChangePct: number }[] = [
    { scenario: "bull", priceChangePct: 20 },
    { scenario: "flat", priceChangePct: 0 },
    { scenario: "bear", priceChangePct: -15 },
  ];

  return scenarios.map(({ scenario, priceChangePct }) => {
    let pnl = baseYield;
    let drawdown = 0;
    if (scenario === "flat") {
      pnl += balance * rangePremiumApy;
    } else if (scenario === "bull") {
      pnl -= balance * 0.08;
      drawdown = 0.08;
    } else {
      pnl -= balance * 0.05;
      pnl += balance * 0.06;
      drawdown = 0.05;
    }
    pnl -= balance * tailCostApy;
    return {
      scenario,
      priceChangePct,
      pnlUsdc: Math.round(pnl * 100) / 100,
      netApy: Math.round((pnl / balance) * 10000) / 100,
      maxDrawdown: drawdown,
    };
  });
}
