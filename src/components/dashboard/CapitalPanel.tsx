import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { toast } from "sonner";
import { DSCard, DSSectionTitle, DSSkeleton } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  buildDepositTx,
  buildRedeemTx,
  buildWithdrawTx,
  createPredictManager,
  fetchManagerSnapshot,
  fetchRedeemablePositions,
  fetchWalletDusdcBalance,
  PREDICT_FAUCET_URL,
  type ManagerSnapshot,
} from "@/lib/veil/capital";
import type { ManagerPositionRow } from "../../../packages/sdk/src/predict-market";

type CapitalPanelProps = {
  onChanged?: () => void;
};

export function CapitalPanel({ onChanged }: CapitalPanelProps) {
  const { user } = useAuth();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const owner = user?.address ?? "";
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [walletUsdc, setWalletUsdc] = useState(0);
  const [snapshot, setSnapshot] = useState<ManagerSnapshot | null>(null);
  const [redeemable, setRedeemable] = useState<ManagerPositionRow[]>([]);
  const [depositAmt, setDepositAmt] = useState("50");
  const [withdrawAmt, setWithdrawAmt] = useState("25");

  const refresh = useCallback(async () => {
    if (!owner) {
      setSnapshot(null);
      setWalletUsdc(0);
      setRedeemable([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [wallet, mgr] = await Promise.all([
        fetchWalletDusdcBalance(client, owner),
        fetchManagerSnapshot(owner),
      ]);
      setWalletUsdc(wallet);
      setSnapshot(mgr);
      if (mgr.managerId) {
        const positions = await fetchRedeemablePositions(mgr.managerId);
        setRedeemable(positions);
      } else {
        setRedeemable([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load capital");
    } finally {
      setLoading(false);
    }
  }, [client, owner]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function ensureManager(): Promise<string> {
    if (snapshot?.managerId) return snapshot.managerId;
    setBusy("create");
    try {
      const id = await createPredictManager(owner, signAndExecute);
      toast.success("PredictManager created");
      await refresh();
      onChanged?.();
      return id;
    } finally {
      setBusy(null);
    }
  }

  async function onDeposit() {
    const amount = Number(depositAmt);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid deposit amount");
      return;
    }
    if (amount > walletUsdc) {
      toast.error(`Wallet only has ${walletUsdc.toFixed(2)} dUSDC`);
      return;
    }
    setBusy("deposit");
    try {
      const managerId = await ensureManager();
      const tx = await buildDepositTx(client, owner, managerId, amount);
      await signAndExecute({ transaction: tx });
      toast.success(`Deposited ${amount} dUSDC into your manager`);
      await refresh();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setBusy(null);
    }
  }

  async function onWithdraw() {
    const amount = Number(withdrawAmt);
    if (!snapshot?.managerId) {
      toast.error("Create a manager first");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid withdraw amount");
      return;
    }
    if (amount > (snapshot.balanceUsdc ?? 0)) {
      toast.error("Amount exceeds idle manager balance (open positions lock collateral)");
      return;
    }
    setBusy("withdraw");
    try {
      const tx = buildWithdrawTx(snapshot.managerId, owner, amount);
      await signAndExecute({ transaction: tx });
      toast.success(`Withdrew ${amount} dUSDC to wallet`);
      await refresh();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdraw failed");
    } finally {
      setBusy(null);
    }
  }

  async function onRedeem(pos: ManagerPositionRow) {
    if (!snapshot?.managerId) return;
    setBusy(`redeem-${pos.oracleId}`);
    try {
      const tx = buildRedeemTx(snapshot.managerId, owner, pos);
      await signAndExecute({ transaction: tx });
      toast.success("Position redeemed — dUSDC returned to manager");
      await refresh();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Redeem failed");
    } finally {
      setBusy(null);
    }
  }

  const managerId = snapshot?.managerId;
  const managerBal = snapshot?.balanceUsdc ?? 0;

  return (
    <DSCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DSSectionTitle icon={Wallet} title="Trading capital" />
        <p className="mt-1 max-w-xl text-sm text-[color:var(--ds-muted)]">
          Your own PredictManager — deposit dUSDC before orders, withdraw idle balance anytime.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || !!busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--ds-border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--ds-muted)] transition-colors hover:bg-[color:var(--ds-hover)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <DSSkeleton className="h-10 w-full" />
          <DSSkeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                Wallet dUSDC
              </div>
              <div className="mt-2 font-display text-2xl">{walletUsdc.toFixed(2)}</div>
              <a
                href={PREDICT_FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-amber-400 hover:underline"
              >
                Get testnet dUSDC <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-xl border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ds-muted)]">
                Manager balance
              </div>
              <div className="mt-2 font-display text-2xl">{managerBal.toFixed(2)}</div>
              <div className="mt-2 font-mono text-[11px] text-[color:var(--ds-muted)]">
                {snapshot?.openPositions ?? 0} open · {snapshot?.awaitingSettlement ?? 0} settling
              </div>
            </div>
          </div>

          {!managerId ? (
            <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4">
              <p className="text-sm text-[color:var(--ds-muted)]">
                No PredictManager yet. Create one (free tx) then deposit dUSDC — modes spend from{" "}
                <em>your</em> manager, not the shared demo pool.
              </p>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void ensureManager()}
                className="mt-3 rounded-full bg-[color:var(--ds-accent)] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--ds-accent-fg)]"
              >
                {busy === "create" ? "Creating…" : "Create manager"}
              </button>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-[color:var(--ds-muted)]">
              Manager{" "}
              <span className="text-[color:var(--ds-fg)]">
                {managerId.slice(0, 10)}…{managerId.slice(-6)}
              </span>
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ds-muted)]">
                Deposit to manager
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value)}
                  className="w-full rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void onDeposit()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                  {busy === "deposit" ? "…" : "Deposit"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ds-muted)]">
                Withdraw idle balance
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={withdrawAmt}
                  onChange={(e) => setWithdrawAmt(e.target.value)}
                  className="w-full rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  disabled={!!busy || !managerId}
                  onClick={() => void onWithdraw()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--ds-border)] bg-[color:var(--ds-pill)] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em]"
                >
                  <ArrowUpFromLine className="h-4 w-4" />
                  {busy === "withdraw" ? "…" : "Withdraw"}
                </button>
              </div>
              <p className="font-mono text-[10px] text-[color:var(--ds-muted)]">
                Only idle dUSDC — collateral in open positions stays locked until settlement.
              </p>
            </div>
          </div>

          {redeemable.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ds-muted)]">
                Redeem settled positions
              </div>
              <ul className="mt-2 divide-y divide-[color:var(--ds-border)] rounded-xl border border-[color:var(--ds-border)]">
                {redeemable.map((p) => (
                  <li
                    key={`${p.oracleId}-${p.strike}-${p.isUp}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="font-mono text-[11px]">
                      {p.isUp ? "UP" : "DOWN"} · qty {p.openQuantity} · ~
                      {p.redeemableUsdc.toFixed(2)} dUSDC
                    </div>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void onRedeem(p)}
                      className="rounded-full border border-[color:var(--ds-border)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
                    >
                      {busy === `redeem-${p.oracleId}` ? "…" : "Redeem"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </DSCard>
  );
}
