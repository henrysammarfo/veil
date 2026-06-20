import { kellyParlaySize } from "../kelly.js";
import { sviBackSolve, type SviParams } from "../svi.js";

export interface ParlayLeg {
  asset: string;
  strike: number;
  forward: number;
  svi: SviParams;
  timeHorizonHours: number;
}

export interface ParlayPlan {
  marketProb: number;
  userConviction: number;
  correlation: number;
  stake: number;
  legProbs: number[];
  warnLowCorrelation: boolean;
}

export function priceParlay(
  legs: ParlayLeg[],
  userConviction: number,
  correlation: number,
  balance: number,
  maxStake?: number,
): ParlayPlan {
  const legProbs = legs.map((leg) => {
    const t = leg.timeHorizonHours / (24 * 365);
    return sviBackSolve(leg.svi, leg.strike, leg.forward, t);
  });

  let marketProb = legProbs.reduce((a, b) => a * b, 1);
  marketProb *= 1 + correlation * 0.08;

  const stake = kellyParlaySize(userConviction, marketProb, balance, maxStake);
  const warnLowCorrelation = correlation < 0.5 && legs.length > 1;

  return {
    marketProb,
    userConviction,
    correlation,
    stake,
    legProbs,
    warnLowCorrelation,
  };
}

export interface ParlayExecutionLeg {
  asset: string;
  strike: number;
  sizeUsdc: number;
}

export function splitParlayStake(stake: number, legs: ParlayLeg[]): ParlayExecutionLeg[] {
  const each = stake / legs.length;
  return legs.map((leg) => ({
    asset: leg.asset,
    strike: leg.strike,
    sizeUsdc: each,
  }));
}
