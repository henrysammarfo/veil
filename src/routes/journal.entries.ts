export type JournalEntry = {
  date: string;
  tag: string;
  title: string;
  body: string;
};

export const ENTRIES: JournalEntry[] = [
  {
    date: "2026-06-21",
    tag: "SUBMIT",
    title: "Sui Overflow submitted",
    body: "DeepSurge form filed — Special · DeepBook track. Demo video youtu.be/byFuYmAPL6Q, live app veil-reviewer.vercel.app, judge path in docs/JUDGES.md. Deadline June 21 (6 PM Pacific). Awaiting shortlist · Demo Day July 20–21.",
  },
  {
    date: "2026-06-21",
    tag: "DEMO",
    title: "Submission-ready pass",
    body: "Live orders across dashboard until Predict redeem. Execute proxy 280s on Vercel + Azure. Intent lock, Portfolio on-chain positions, judge guide + demo script shipped. Package 0xb69f…d54da on testnet.",
  },
  {
    date: "2026-06-20",
    tag: "LIVE",
    title: "Reviewer app + hosted backend",
    body: "veil-reviewer.vercel.app — Google/wallet auth, no clone required. Azure enclave + API for judges. Separate waitlist deploy for public site.",
  },
  {
    date: "2026-06-17",
    tag: "SHIP",
    title: "Four modes + attestation viewer",
    body: "BULL, BEAR, EARN, PARLAY on Azure enclave. Public /attest viewer, discover leaderboard, LLM plain-English intents with locked auto-config.",
  },
  {
    date: "2026-06-15",
    tag: "PNL",
    title: "Realized PnL from keeper",
    body: "Settlement sync after redeem. Dashboard shows expected vs realized profit per stealth order.",
  },
  {
    date: "2026-06-11",
    tag: "AUTH",
    title: "Enoki zkLogin shipped",
    body: "Google sign-in with sponsored testnet txs. Server-side prefs — no localStorage for session data.",
  },
  {
    date: "2026-06-07",
    tag: "TEE",
    title: "ExecutionProof on Sui",
    body: "Move verifier + enclave signatures. Registry on testnet — record_execution when package env is set.",
  },
  {
    date: "2026-06-01",
    tag: "START",
    title: "Veil kickoff",
    body: "DeepBook Predict track · Sui Overflow 2026 · submission June 21 · Demo Day July 20–21 if shortlisted.",
  },
];
