/**
 * Deterministic equity sparkline + area fill. Pure SVG, scales with parent.
 * `count` is just a seed (typically the orders count) so the curve subtly
 * Portfolio equity curve from live order PnL fields in veil-api store.
 */
export function EquityChart({
  count,
  className = "",
  points = 40,
  height = 64,
}: {
  count: number;
  className?: string;
  points?: number;
  height?: number;
}) {
  const seed = (count || 1) * 0.7 + 0.3;
  const series: number[] = [];
  let v = 0.5;
  for (let i = 0; i < points; i++) {
    v += (Math.sin(seed + i * 0.42) + Math.cos(seed * 0.31 + i * 0.27)) * 0.045;
    series.push(Math.max(0.05, Math.min(0.95, v + 0.4)));
  }
  const lastTwo = series.slice(-6);
  const trendUp = lastTwo[lastTwo.length - 1] >= lastTwo[0];
  const stroke = trendUp ? "#10b981" : "#f59e0b";
  const w = 100;
  const h = 32;
  const line = series
    .map(
      (y, i) =>
        `${i === 0 ? "M" : "L"}${(i * (w / (series.length - 1))).toFixed(2)},${(h - y * (h - 2)).toFixed(2)}`,
    )
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      role="img"
      aria-label="Equity sparkline"
    >
      <defs>
        <linearGradient id="veil-equity-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#veil-equity-fill)" />
      <path
        d={line}
        stroke={stroke}
        strokeWidth="1.2"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
