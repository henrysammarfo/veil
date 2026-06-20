import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useConnectWallet,
  useCurrentAccount,
  useDisconnectWallet,
  useWallets,
} from "@mysten/dapp-kit";
import { isGoogleWallet } from "@mysten/enoki";

import { VEIL_CONFIG } from "@/lib/veil/config";

export type AuthMethod = "wallet" | "google";

export interface AuthUser {
  id: string;
  method: AuthMethod;
  address: string;
  label: string;
  avatarSeed: string;
  createdAt: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (method: AuthMethod) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutateAsync: connectWallet } = useConnectWallet();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const signIn = useCallback<AuthState["signIn"]>(
    async (method) => {
      const target =
        method === "google"
          ? wallets.find((w) => isGoogleWallet(w))
          : wallets.find((w) => !isGoogleWallet(w));

      if (!target) {
        if (method === "google") {
          throw new Error(
            "Google zkLogin unavailable — set VITE_ENOKI_PUBLIC_KEY and VITE_GOOGLE_CLIENT_ID in .env",
          );
        }
        throw new Error("No Sui wallet found — install Sui Wallet or another compatible extension");
      }

      const result = await connectWallet({ wallet: target });
      const addr = result.accounts[0]?.address ?? target.accounts[0]?.address ?? account?.address;
      if (!addr) throw new Error("Wallet connected but no address returned");

      return {
        id: addr,
        method,
        address: addr,
        label: method === "google" ? "Google zkLogin" : target.name,
        avatarSeed: addr,
        createdAt: Date.now(),
      };
    },
    [account?.address, connectWallet, wallets],
  );

  const signOut = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  const user = useMemo<AuthUser | null>(() => {
    if (!account) return null;
    const wallet = wallets.find((w) => w.accounts.some((a) => a.address === account.address));
    const method: AuthMethod = wallet && isGoogleWallet(wallet) ? "google" : "wallet";
    return {
      id: account.address,
      method,
      address: account.address,
      label: wallet?.name ?? shortAddress(account.address),
      avatarSeed: account.address,
      createdAt: Date.now(),
    };
  }, [account, wallets]);

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
  return addr.length > head + tail + 2 ? `${addr.slice(0, head)}…${addr.slice(-tail)}` : addr;
}

/** True when Enoki public key + Google OAuth are configured for zkLogin. */
export function isZkLoginConfigured(): boolean {
  return Boolean(VEIL_CONFIG.enokiPublicKey && import.meta.env.VITE_GOOGLE_CLIENT_ID);
}
