export type JournalEntry = {
  date: string;
  tag: string;
  title: string;
  body: string;
};

export const ENTRIES: JournalEntry[] = [
  {
    date: "2026-06-20",
    tag: "LIVE",
    title: "Azure API + public waitlist split",
    body: "Enclave and API live on testnet. Separate waitlist and judge dev builds. Light theme contrast fixes on marketing pages.",
  },
  {
    date: "2026-06-17",
    tag: "SHIP",
    title: "Four modes + attestation viewer",
    body: "BULL, BEAR, EARN, PARLAY on Azure enclave. Public /attest viewer, live discover board, judge access gate for reviewers.",
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
    body: "Move verifier + enclave signatures. PCR registration on testnet registry.",
  },
  {
    date: "2026-06-01",
    tag: "START",
    title: "Veil kickoff",
    body: "DeepBook Predict track · DeepSurge deadline June 24 · shortlist expected July.",
  },
];
