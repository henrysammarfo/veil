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

import { useSignAndExecuteTransaction, useSignTransaction, useWallets } from "@mysten/dapp-kit";

import { getSession, isGoogleWallet } from "@mysten/enoki";

import { VEIL_PACKAGE_IDS } from "@/lib/veil/config";

import {

  fetchOrders,

  fetchProofs,

  placeOrder as apiPlaceOrder,

  syncSettlement,

  type PlaceOrderInput,

} from "@/lib/veil/api";

import { recordProofWithEnoki, recordProofWithWallet } from "@/lib/veil/record-proof";

import { fetchPrefs } from "@/lib/veil/prefs";

import { fetchManagerSnapshot } from "@/lib/veil/capital";

import { computeStats } from "./stats";

import {

  INTERVALS,

  type ArchiveEntry,

  type Order,

  type OrderMode,

  type Proof,

  type ResourceKey,

  type VeilDashboardData,

} from "./types";



const Ctx = createContext<VeilDashboardData | null>(null);



export function VeilDataProvider({ children }: { children: ReactNode }) {

  const { user } = useAuth();

  const wallets = useWallets();

  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const { mutateAsync: signTransaction } = useSignTransaction();

  const trader = user?.address ?? "";



  const [orders, setOrders] = useState<Order[]>([]);

  const [proofs, setProofs] = useState<Proof[]>([]);

  const [archive] = useState<ArchiveEntry[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [predictManagerId, setPredictManagerId] = useState<string | null>(null);

  const [ticks, setTicks] = useState<Record<ResourceKey, number>>({

    orders: Date.now(),

    proofs: Date.now(),

    archive: Date.now(),

  });



  const load = useCallback(async () => {

    if (!trader) {

      setOrders([]);

      setProofs([]);

      setPredictManagerId(null);

      setLoading(false);

      return;

    }

    try {

      setError(null);
      const [prefs, mgr] = await Promise.all([fetchPrefs(trader), fetchManagerSnapshot(trader)]);
      const managerId = prefs.predictManagerId ?? mgr.managerId ?? undefined;
      setPredictManagerId(managerId ?? null);
      await syncSettlement(managerId);
      const [o, p] = await Promise.all([fetchOrders(trader), fetchProofs(trader)]);

      setOrders(o);

      setProofs(p);

      const now = Date.now();

      setTicks({ orders: now, proofs: now, archive: now });

    } catch (e) {

      setError(e instanceof Error ? e.message : "Failed to load dashboard");

      setOrders([]);

      setProofs([]);

    } finally {

      setLoading(false);

    }

  }, [trader]);



  useEffect(() => {

    setLoading(true);

    void load();

  }, [load]);



  useEffect(() => {

    if (!trader || loading) return;

    const id = setInterval(() => void load(), INTERVALS.orders);

    return () => clearInterval(id);

  }, [trader, loading, load]);



  const refresh = useCallback(

    async (key?: ResourceKey) => {

      setLoading(true);

      await load();

      if (key) setTicks((t) => ({ ...t, [key]: Date.now() }));

      setLoading(false);

    },

    [load],

  );



  const getProof = useCallback((id: string) => proofs.find((p) => p.id === id), [proofs]);

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);



  const placeOrder = useCallback(

    async (input: {

      asset: string;

      mode: OrderMode;

      wallet: string;

      intent: string;

      sizeUsdc: number;

      timeHorizonHours: number;

      direction: "LONG" | "SHORT";

      userConvictionPct?: number;

    }) => {

      const sym = input.asset.split("/")[0]!;

      const body: PlaceOrderInput = {

        direction: input.direction,

        asset: sym,

        sizeUsdc: input.sizeUsdc,

        timeHorizonHours: input.timeHorizonHours,

        userConvictionPct: input.userConvictionPct ?? 65,

        maxSlippageBps: 50,

        mode: input.mode,

        intent: input.intent,

        trader: input.wallet,

        traderAddress: input.wallet,

        managerId: predictManagerId ?? undefined,

      };

      const result = await apiPlaceOrder(body);

      if (result.onChainAttestation && VEIL_PACKAGE_IDS.veilPackageId) {

        try {

          let proofDigest: string | null = null;

          if (user?.method === "google") {

            const googleWallet = wallets.find(isGoogleWallet);

            if (googleWallet) {

              const session = await getSession(googleWallet);

              if (session?.jwt) {

                proofDigest = await recordProofWithEnoki(result, session.jwt, async ({ transaction }) => {

                  const r = await signTransaction({ transaction: transaction as never });

                  return { signature: r.signature };

                });

              }

            }

          } else {

            proofDigest = await recordProofWithWallet(result, async ({ transaction }) => {

              const r = await signAndExecute({ transaction: transaction as never });

              return { digest: r.digest };

            });

          }

          if (proofDigest) {
            Object.assign(result, { proofObjectDigest: proofDigest });
          }

        } catch (e) {

          console.warn("record_execution on-chain:", e);

        }

      }

      const order = (result.order ?? {

        id: result.executionId,

        intent: input.intent,

        mode: input.mode,

        state: "EXECUTING",

        progress: 0,

        slices: { filled: 0, total: 8 },

        pnl: "+0.00%",

        asset: input.asset,

        wallet: input.wallet,

        createdAt: Date.now(),

        sizeUsdc: input.sizeUsdc,

        payload: result,

      }) as Order;

      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);

      await load();

      return order;

    },

    [load, predictManagerId, signAndExecute, signTransaction, user?.method, wallets],

  );



  const stats = useMemo(() => computeStats(orders, proofs), [orders, proofs]);

  const walletsList = useMemo(() => (trader ? [trader] : []), [trader]);

  const lastTick = Math.max(ticks.orders, ticks.proofs, ticks.archive);



  const value: VeilDashboardData = {

    orders,

    proofs,

    archive,

    stats,

    loading,

    error,

    lastTick,

    ticks,

    intervals: INTERVALS,

    refresh,

    getProof,

    getOrder,

    wallets: walletsList,

    placeOrder,

  };



  return (

    <Ctx.Provider value={value}>

      {error && !loading && (

        <div className="fixed bottom-20 left-4 right-4 z-[60] rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center font-mono text-[11px] text-amber-200 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">

          API offline — start{" "}

          <code className="text-amber-100">npm run api</code> +{" "}

          <code className="text-amber-100">npm run enclave</code>

        </div>

      )}

      {!trader && !loading && (

        <div className="fixed bottom-20 left-4 right-4 z-[60] rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-center text-sm text-sky-100 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">

          Sign in to load your orders and proofs from the enclave.

        </div>

      )}

      {children}

    </Ctx.Provider>

  );

}



export function useVeilData(): VeilDashboardData {

  const v = useContext(Ctx);

  if (!v) throw new Error("useVeilData must be used inside <VeilDataProvider>");

  return v;

}



/** @deprecated use useVeilData — kept for test shims */

export type { ResourceKey } from "./types";

