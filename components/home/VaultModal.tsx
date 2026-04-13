"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { erc20Abi, formatUnits, type Address } from "viem";
import { useReadContracts } from "wagmi";
import { base } from "wagmi/chains";

import { SegmentedProgressBar } from "@/components/shared/SegmentedProgressBar";

type VaultModalProps = {
  activeApy: string;
  activeBreakEven: string;
  activeVaultName: string;
  isOpen: boolean;
  onClose: () => void;
  recoveryProgress: number;
  vaultTokenAddress?: Address;
  walletAddress?: Address;
};

export function VaultModal({
  activeApy,
  activeBreakEven,
  activeVaultName,
  isOpen,
  onClose,
  recoveryProgress,
  vaultTokenAddress,
  walletAddress,
}: VaultModalProps) {
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const portalRoot = typeof document === "undefined" ? null : document.body;
  const shouldReadVaultBalance = Boolean(isOpen && vaultTokenAddress && walletAddress);
  const { data: vaultAssetReads, isLoading: isVaultBalanceLoading } = useReadContracts({
    allowFailure: true,
    contracts:
      vaultTokenAddress && walletAddress
        ? [
            {
              abi: erc20Abi,
              address: vaultTokenAddress,
              args: [walletAddress],
              chainId: base.id,
              functionName: "balanceOf",
            },
            {
              abi: erc20Abi,
              address: vaultTokenAddress,
              chainId: base.id,
              functionName: "decimals",
            },
            {
              abi: erc20Abi,
              address: vaultTokenAddress,
              chainId: base.id,
              functionName: "symbol",
            },
          ]
        : [],
    query: {
      enabled: shouldReadVaultBalance,
    },
  });

  const balanceRead = vaultAssetReads?.[0];
  const decimalsRead = vaultAssetReads?.[1];
  const symbolRead = vaultAssetReads?.[2];
  const vaultBalance =
    balanceRead?.status === "success" && typeof balanceRead.result === "bigint"
      ? balanceRead.result
      : null;
  const vaultDecimals =
    decimalsRead?.status === "success" && typeof decimalsRead.result === "number"
      ? decimalsRead.result
      : 18;
  const vaultSymbol =
    symbolRead?.status === "success" && typeof symbolRead.result === "string"
      ? symbolRead.result
      : "YOUSD";
  const hasVaultReadFailure =
    balanceRead?.status === "failure" ||
    decimalsRead?.status === "failure" ||
    symbolRead?.status === "failure";
  const formattedVaultBalance =
    vaultBalance !== null
      ? formatVaultTokenAmount(vaultBalance, vaultDecimals)
      : isVaultBalanceLoading
        ? "..."
        : walletAddress
          ? "0.00"
          : "--";
  const balanceStatus = !walletAddress
    ? "Connect a wallet to read your live Base vault balance."
    : !vaultTokenAddress
      ? "Pick a live Base vault first so the app knows which vault token to read."
      : hasVaultReadFailure
        ? "Base read failed for this vault token. Check whether the selected vault exposes an ERC-20 balance."
        : "Live balance is read directly from Base and reflects the current wallet holdings.";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleWithdrawClick = () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setShowToast(true);
    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 1800);
  };

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="vault-modal-frame technical-grid absolute left-1/2 top-1/2 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[var(--color-panel)] p-6 shadow-2xl md:p-8"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <PixelBagIcon />
                <div>
                  <p className="vault-modal-title text-[13px] uppercase text-white">
                    My Vault Assets
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
                    Recovery Position Snapshot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close vault modal"
                className="vault-close-button pixel-box grid size-10 place-items-center bg-white/5 font-mono text-sm uppercase text-zinc-300 transition hover:text-white"
              >
                X
              </button>
            </div>

            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Vault Token Balance
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <p className="vault-balance-readout text-[2.6rem] text-white md:text-[3.4rem]">
                  {formattedVaultBalance}
                </p>
                <p className="vault-balance-unit pb-2 text-[var(--color-accent)]">
                  {vaultSymbol}
                </p>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                {balanceStatus}
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <VaultMeta label="Current APY" value={activeApy || "12.3%"} />
              <VaultMeta label="Active Vault" value={activeVaultName} />
              <VaultMeta label="Break-even" value={activeBreakEven} />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <span>24H Recovery</span>
                <span className="text-[var(--color-accent)]">
                  {Math.round(recoveryProgress)}%
                </span>
              </div>
              <SegmentedProgressBar value={recoveryProgress} />
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleWithdrawClick}
                className="vault-withdraw-button pixel-box px-5 py-4 text-[12px] uppercase text-[#031f14]"
              >
                Withdraw
              </button>
              <p className="max-w-xs text-right text-sm leading-6 text-zinc-500">
                Withdrawal flow is intentionally stubbed here while the deposit UX stays
                front and center.
              </p>
            </div>

            <AnimatePresence>
              {showToast ? (
                <motion.div
                  className="vault-toast pixel-box fixed bottom-6 left-1/2 z-[150] -translate-x-1/2 bg-[var(--color-panel)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  Coming Soon
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalRoot,
  );
}

function VaultMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="pixel-box bg-white/4 px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 truncate font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.03em] text-white">
        {value}
      </p>
    </div>
  );
}

function PixelBagIcon() {
  return (
    <div className="pixel-bag-icon" aria-hidden="true">
      <span className="pixel-bag-knot" />
      <span className="pixel-bag-body" />
      <span className="pixel-bag-highlight" />
      <span className="pixel-bag-coin pixel-bag-coin-a" />
      <span className="pixel-bag-coin pixel-bag-coin-b" />
    </div>
  );
}

function formatVaultTokenAmount(value: bigint, decimals: number) {
  const formatted = Number.parseFloat(formatUnits(value, decimals));

  if (!Number.isFinite(formatted) || formatted <= 0) {
    return "0.00";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: formatted < 1 ? 6 : 4,
    minimumFractionDigits: formatted < 1 ? 2 : 0,
  }).format(formatted);
}
