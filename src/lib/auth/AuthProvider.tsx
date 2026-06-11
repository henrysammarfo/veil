import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Veil Auth — Mock layer with a stable interface that mirrors what we'll wire
 * into Enoki (zkLogin) + Sui dapp-kit when the repo is cloned.
 *
 * REPLACING WITH REAL ENOKI (drop-in steps for the cloner):
 *   1. bun add @mysten/enoki @mysten/dapp-kit @mysten/sui
 *   2. Wrap <AuthProvider> with <SuiClientProvider> + <EnokiFlowProvider apiKey={...}>.
 *   3. In `signIn`, swap the mock branch for:
 *        - method="google":  await enoki.createAuthorizationURL({ provider: "google" })
 *        - method="email":   await enoki.sendEmailOtp(...) + verifyOtp
 *        - method="wallet":  useCurrentAccount() from @mysten/dapp-kit
 *   4. Read the user from useZkLogin() / useCurrentAccount() and feed into setUser.
 *   5. Keep the AuthUser shape — every consumer in the app reads it.
 */

export type AuthMethod = "wallet" | "google" | "email";

export interface AuthUser {
  id: string;
  method: AuthMethod;
  /** Sui address (zkLogin-derived or wallet). Mock = deterministic 0x...mock */
  address: string;
  /** Display label (email, "Sui Wallet", "google:henry@…") */
  label: string;
  avatarSeed: string;
  createdAt: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (method: AuthMethod, payload?: { email?: string }) => Promise<AuthUser>;
  signOut: () => void;
}

const STORAGE_KEY = "veil.auth.user";

const AuthContext = createContext<AuthState | null>(null);

function mockAddress(seed: string): string {
  // Deterministic 64-hex chars from seed — looks like a Sui address.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < 16; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return "0x" + out.slice(0, 64);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback<AuthState["signIn"]>(async (method, payload) => {
    // Simulate network latency so the UX feels real.
    await new Promise((r) => setTimeout(r, 650));

    const seed =
      method === "email"
        ? payload?.email ?? "anon@veil.app"
        : method === "google"
        ? "google:" + (payload?.email ?? "henry@veil.app")
        : "wallet:sui";

    const next: AuthUser = {
      id: crypto.randomUUID(),
      method,
      address: mockAddress(seed),
      label:
        method === "email"
          ? payload?.email ?? "you@veil.app"
          : method === "google"
          ? payload?.email ?? "Google Account"
          : "Sui Wallet",
      avatarSeed: seed,
      createdAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signOut,
    }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function shortAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return "";
  return addr.length > head + tail + 2
    ? `${addr.slice(0, head)}…${addr.slice(-tail)}`
    : addr;
}
