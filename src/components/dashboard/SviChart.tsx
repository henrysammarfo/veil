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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        Live SVI σ · predict-server
      </p>
      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="t" hide />
            <YAxis domain={[0.2, 0.8]} tick={{ fill: "#6F6F6F", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #333" }}
              labelStyle={{ color: "#999" }}
            />
            <Line type="monotone" dataKey="vol" stroke="#22d3ee" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
