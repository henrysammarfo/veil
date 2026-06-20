/** DeepBook Predict testnet — pinned 2026-06-17 per Sui docs */
export const PREDICT_TESTNET = {
  network: "testnet" as const,
  branch: "predict-testnet-4-16",
  serverUrl: "https://predict-server.testnet.mystenlabs.com",
  packageId: "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138",
  registryId: "0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64",
  predictObjectId: "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
  dusdcType: "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  plpType: "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP",
  faucetUrl: "https://tally.so/r/Xx102L",
  /** Live oracle/manager — refresh via `npm run setup:predict` */
  defaultOracleId: "0xc33b9dac1a0fbfd2988fcd89dccbdd3caa4a7b788241537ccef6f007da2c5d7e",
  defaultOracleExpiry: 1783670400000,
} as const;

export const MEMWAL_STAGING = {
  playgroundUrl: "https://staging.memwal.ai",
  relayerUrl: "https://relayer-staging.memory.walrus.xyz",
  namespace: "veil-executions",
} as const;
