import { createHash } from "node:crypto";
import type { StoredOrderRow } from "./settlement.ts";

export interface ArchiveEntryRow {
  date: string;
  hash: string;
  size: string;
  proofs: number;
  url: string;
  dayKey: string;
}

const PUBLIC_APP = process.env.VEIL_PUBLIC_URL ?? "https://veil-reviewer.vercel.app";

function fmtUsd(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

/** Roll up orders by UTC day into Walrus-style daily report rows. */
export function buildDailyArchive(
  rows: StoredOrderRow[],
  trader: string,
): ArchiveEntryRow[] {
  const filtered = rows.filter((r) => r.trader === trader);
  const byDay = new Map<
    string,
    { notional: number; count: number; hashes: string[]; reportUrls: string[] }
  >();

  for (const row of filtered) {
    const dayKey = new Date(row.createdAt).toISOString().slice(0, 10);
    const bucket = byDay.get(dayKey) ?? {
      notional: 0,
      count: 0,
      hashes: [],
      reportUrls: [],
    };
    bucket.notional += Number(row.order.sizeUsdc ?? 0);
    bucket.count += 1;
    const h = String(row.order.attestationHash ?? row.execution.attestationHash ?? "");
    if (h.length >= 16) bucket.hashes.push(h);
    const ru = String(row.execution.reportUrl ?? "");
    if (ru && !ru.includes("/unknown")) bucket.reportUrls.push(ru);
    byDay.set(dayKey, bucket);
  }

  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKey, bucket]) => {
      const rollup =
        bucket.hashes.length > 0
          ? createHash("sha256").update(bucket.hashes.sort().join(":")).digest("hex")
          : createHash("sha256").update(`${trader}:${dayKey}`).digest("hex");
      const primary = bucket.hashes[0] ?? rollup;
      const url =
        bucket.reportUrls[0] ??
        `${PUBLIC_APP}/attest/${primary.startsWith("0x") ? primary.slice(2) : primary}`;
      const d = new Date(`${dayKey}T12:00:00.000Z`);
      return {
        dayKey,
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        hash: `${primary.slice(0, 10)}…${primary.slice(-6)}`,
        size: fmtUsd(bucket.notional),
        proofs: bucket.count,
        url,
      };
    });
}

export function buildWalrusDailyProofs(
  archive: ArchiveEntryRow[],
  trader: string,
): Record<string, unknown>[] {
  return archive.map((a) => ({
    id: `walrus-daily-${a.dayKey}`,
    t: a.date,
    tag: "WALRUS",
    text: `Daily report sealed · ${a.proofs} proof${a.proofs === 1 ? "" : "s"} · ${a.size} notional`,
    hash: a.hash.replace("…", "").slice(0, 66) || a.dayKey,
    reportUrl: a.url,
    createdAt: new Date(`${a.dayKey}T23:59:00.000Z`).getTime(),
    payload: {
      type: "veil_daily_report",
      dayKey: a.dayKey,
      trader,
      size: a.size,
      proofs: a.proofs,
      reportUrl: a.url,
    },
  }));
}
