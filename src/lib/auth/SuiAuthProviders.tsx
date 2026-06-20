import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { createNetworkConfig } from "@mysten/dapp-kit";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { registerEnokiWallets } from "@mysten/enoki";
import { useEffect, type ReactNode } from "react";

import { VEIL_CONFIG } from "@/lib/veil/config";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export function SuiAuthProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!VEIL_CONFIG.enokiPublicKey || !GOOGLE_CLIENT_ID) return;

    const client = new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(VEIL_CONFIG.suiNetwork),
      network: VEIL_CONFIG.suiNetwork,
    });

    const { unregister } = registerEnokiWallets({
      apiKey: VEIL_CONFIG.enokiPublicKey,
      client,
      network: VEIL_CONFIG.suiNetwork,
      providers: {
        google: { clientId: GOOGLE_CLIENT_ID },
      },
    });

    return () => unregister();
  }, []);

  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork={VEIL_CONFIG.suiNetwork}>
      <WalletProvider autoConnect>{children}</WalletProvider>
    </SuiClientProvider>
  );
}

export function isLiveSuiAuth(): boolean {
  return Boolean(VEIL_CONFIG.enokiPublicKey);
}
