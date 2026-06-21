import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLiveSvi } from "@/lib/veil/hooks";

export function SviChart() {
  const { svi } = useLiveSvi();
  const sigma = svi?.sigma ?? 0.42;
  const data = Array.from({ length: 12 }, (_, i) => ({
    t: `T${i}`,
    vol: Math.max(0.2, sigma + Math.sin(i / 2) * 0.08),
  }));

  return (
    <div className="rounded-2xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--ds-muted)]">
        Live SVI sigma · predict-server
      </p>
      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="t" hide />
            <YAxis
              domain={[0.2, 0.8]}
              tick={{ fill: "var(--ds-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: 8,
                color: "var(--ds-fg)",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--ds-muted)" }}
            />
            <Line
              type="monotone"
              dataKey="vol"
              stroke="var(--ds-accent)"
              dot={false}
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
