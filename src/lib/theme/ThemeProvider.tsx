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

type Theme = "dark" | "light";

interface Ctx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<Ctx | null>(null);

function apply(t: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.classList.toggle("light", t === "light");
  html.classList.toggle("dark", t === "dark");
  html.dataset.theme = t;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    apply("dark");
    if (!user?.address) return;
    void fetchPrefs(user.address).then((p) => {
      const t = p.theme === "light" ? "light" : "dark";
      setThemeState(t);
      apply(t);
    });
  }, [user?.address]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      apply(t);
      if (user?.address) void savePrefs(user.address, { theme: t });
    },
    [user?.address],
  );

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
