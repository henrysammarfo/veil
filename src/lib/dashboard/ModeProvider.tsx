import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchPrefs, savePrefs } from "@/lib/veil/prefs";

export type CockpitMode = "lite" | "pro";

interface Ctx {
  mode: CockpitMode;
  isPro: boolean;
  setMode: (m: CockpitMode) => void;
  toggle: () => void;
}

const ModeCtx = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<CockpitMode>("lite");

  useEffect(() => {
    if (!user?.address) return;
    void fetchPrefs(user.address).then((p) => {
      if (p.cockpitMode === "lite" || p.cockpitMode === "pro") setModeState(p.cockpitMode);
    });
  }, [user?.address]);

  const setMode = useCallback(
    (m: CockpitMode) => {
      setModeState(m);
      if (user?.address) void savePrefs(user.address, { cockpitMode: m });
    },
    [user?.address],
  );

  const toggle = useCallback(() => setMode(mode === "lite" ? "pro" : "lite"), [mode, setMode]);

  const value = useMemo<Ctx>(
    () => ({ mode, isPro: mode === "pro", setMode, toggle }),
    [mode, setMode, toggle],
  );

  return <ModeCtx.Provider value={value}>{children}</ModeCtx.Provider>;
}

export function useCockpitMode(): Ctx {
  const v = useContext(ModeCtx);
  if (!v) throw new Error("useCockpitMode must be used inside <ModeProvider>");
  return v;
}
