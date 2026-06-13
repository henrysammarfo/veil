import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CockpitMode = "lite" | "pro";
const KEY = "veil.cockpit.mode";

interface Ctx {
  mode: CockpitMode;
  isPro: boolean;
  setMode: (m: CockpitMode) => void;
  toggle: () => void;
}

const ModeCtx = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CockpitMode>("lite");

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(KEY) as CockpitMode | null;
      if (v === "lite" || v === "pro") setModeState(v);
    } catch { /* ignore */ }
  }, []);

  const setMode = useCallback((m: CockpitMode) => {
    setModeState(m);
    try { window.localStorage.setItem(KEY, m); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => setMode(mode === "lite" ? "pro" : "lite"), [mode, setMode]);

  const value = useMemo<Ctx>(() => ({ mode, isPro: mode === "pro", setMode, toggle }), [mode, setMode, toggle]);

  return <ModeCtx.Provider value={value}>{children}</ModeCtx.Provider>;
}

export function useCockpitMode(): Ctx {
  const v = useContext(ModeCtx);
  if (!v) throw new Error("useCockpitMode must be used inside <ModeProvider>");
  return v;
}
