/** Official-style token logos (CDN). Swap src map when wiring 21st.dev asset pack. */

const LOGO: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SUI: "https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  DUSDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
};

function symbolFromAsset(asset: string): string {
  const base = asset.split("/")[0]?.toUpperCase() ?? asset.toUpperCase();
  return base.replace("DUSDC", "USDC");
}

export function TokenIcon({ asset, className = "h-5 w-5" }: { asset: string; className?: string }) {
  const sym = symbolFromAsset(asset);
  const src = LOGO[sym] ?? LOGO.USDC;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`rounded-full bg-white/10 object-cover ${className}`}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
