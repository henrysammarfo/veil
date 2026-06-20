/** Veil API + chain configuration (client-safe env vars only) */
export const VEIL_CONFIG = {
  apiUrl: import.meta.env.VITE_VEIL_API_URL ?? "http://127.0.0.1:8787",
  enclaveUrl: import.meta.env.VITE_VEIL_ENCLAVE_URL ?? "http://127.0.0.1:8080",
  enokiPublicKey: import.meta.env.VITE_ENOKI_PUBLIC_KEY ?? "",
  suiNetwork: (import.meta.env.VITE_SUI_NETWORK ?? "testnet") as "testnet" | "mainnet",
  predictServer: "https://predict-server.testnet.mystenlabs.com",
  predictObjectId: "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
} as const;

export const VEIL_PACKAGE_IDS = {
  /** Set after `sui client publish` — see README */
  veilPackageId: import.meta.env.VITE_VEIL_PACKAGE_ID ?? "",
  registryId: import.meta.env.VITE_VEIL_REGISTRY_ID ?? "",
} as const;
