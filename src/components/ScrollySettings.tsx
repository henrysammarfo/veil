import { useState } from "react";
import { useScrollyConfig, DEFAULT_CONFIG } from "@/lib/scrolly-config";

export function ScrollySettings() {
  const { config, update, reset } = useScrollyConfig();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open scrollytelling settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-8 left-8 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-xl transition-all duration-300 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Scrollytelling settings"
          className="fixed bottom-24 left-8 z-50 w-80 rounded-3xl border border-white/15 p-6 text-white backdrop-blur-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 30px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg" style={{ fontFamily: '"Instrument Serif", serif' }}>Scene Settings</h2>
            <button onClick={() => setOpen(false)} aria-label="Close settings" className="text-white/60 hover:text-white">✕</button>
          </div>

          <Field
            label="Frame Count"
            value={config.frameCount}
            min={1}
            max={500}
            step={1}
            onChange={(v) => update({ frameCount: v })}
          />
          <Field
            label="Zoom Factor"
            value={config.zoomFactor}
            min={1}
            max={2}
            step={0.05}
            onChange={(v) => update({ zoomFactor: v })}
          />
          <Field
            label="Scroll Speed"
            value={config.scrollMultiplier}
            min={0.25}
            max={4}
            step={0.05}
            onChange={(v) => update({ scrollMultiplier: v })}
            hint="Higher = animation completes in less scroll"
          />
          <Field
            label="Eager Preload"
            value={config.eagerCount}
            min={1}
            max={Math.max(1, config.frameCount)}
            step={1}
            onChange={(v) => update({ eagerCount: v })}
            hint="Frames loaded before page becomes interactive"
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                reset();
                window.dispatchEvent(new Event("veil:scrolly-config-change"));
              }}
              className="flex-1 rounded-full border border-white/20 px-4 py-2 text-xs text-white/80 hover:bg-white/5"
            >
              Reset to defaults
            </button>
          </div>

          <p className="mt-3 text-[10px] text-white/40">
            Defaults: {DEFAULT_CONFIG.frameCount} frames · zoom {DEFAULT_CONFIG.zoomFactor} · ×{DEFAULT_CONFIG.scrollMultiplier}
          </p>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const id = `scrolly-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</label>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded bg-white/10 px-2 py-1 text-right text-xs text-white outline-none focus:ring-1 focus:ring-white/40"
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
      {hint && <p className="mt-1 text-[10px] text-white/40">{hint}</p>}
    </div>
  );
}
