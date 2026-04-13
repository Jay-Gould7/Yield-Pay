"use client";

import { useEffect } from "react";
import type { Hash } from "viem";
import { X } from "lucide-react";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { CHAINS } from "@/lib/constants";

type HoldingsModalProps = {
  approvalHash?: Hash | null;
  isOpen: boolean;
  onClose: () => void;
  recentRouteResult?: {
    destinationAddress?: string | null;
    destinationChainId: number;
    expectedOutputAmount?: string | null;
    expectedOutputSymbol: string;
    inputAmount: string;
    inputSymbol: string;
    protocolLabel: string;
    quoteId?: string | null;
    vaultLabel: string;
  } | null;
  routeHash?: Hash | null;
};

export function HoldingsModal({
  approvalHash,
  isOpen,
  onClose,
  recentRouteResult,
  routeHash,
}: HoldingsModalProps) {
  const { assetCount, chainGroups, error, isConnected, isLoading, totalUsd } =
    useWalletAssets();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-8 md:px-8">
        <section
          aria-labelledby="holdings-modal-title"
          aria-modal="true"
          className="w-full max-w-3xl border border-[var(--color-accent)]/20 bg-[var(--color-panel)] shadow-[0_0_60px_rgba(164,255,185,0.08)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div className="flex items-start justify-between border-b border-white/10 bg-white/5 px-6 py-5 md:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                Holdings Snapshot
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-[-0.05em] text-white"
                id="holdings-modal-title"
              >
                Current Wallet Holdings
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Live wallet balances grouped by chain, plus the latest transaction links.
              </p>
            </div>
            <button
              className="border border-white/10 p-2 text-zinc-400 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-6 p-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <SnapshotCard label="Wallet Status" value={isConnected ? "Connected" : "Offline"} />
              <SnapshotCard label="Tracked Assets" value={String(assetCount)} />
              <SnapshotCard
                label="Portfolio Value"
                value={totalUsd.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              />
            </div>

            {recentRouteResult ? (
              <div className="border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Recent Route Result
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InlineMetric
                    label="Input"
                    value={`${recentRouteResult.inputAmount} ${recentRouteResult.inputSymbol}`}
                  />
                  <InlineMetric
                    label="Expected Output"
                    value={
                      recentRouteResult.expectedOutputAmount
                        ? `${recentRouteResult.expectedOutputAmount} ${recentRouteResult.expectedOutputSymbol}`
                        : recentRouteResult.expectedOutputSymbol
                    }
                  />
                  <InlineMetric label="Vault" value={recentRouteResult.vaultLabel} />
                  <InlineMetric label="Protocol" value={recentRouteResult.protocolLabel} />
                  <InlineMetric
                    label="Destination"
                    value={formatChainLabel(recentRouteResult.destinationChainId)}
                  />
                  <InlineMetric
                    label="Recipient"
                    value={
                      recentRouteResult.destinationAddress
                        ? shortenAddress(recentRouteResult.destinationAddress)
                        : "-"
                    }
                  />
                  <InlineMetric
                    label="Quote Id"
                    value={recentRouteResult.quoteId ?? "-"}
                  />
                </div>
                <p className="mt-4 text-sm text-zinc-400">
                  This result is taken from the latest executed quote and route metadata, so it can
                  explain where funds went even if wallet balance indexing is delayed.
                </p>
              </div>
            ) : null}

            {approvalHash || routeHash ? (
              <div className="grid gap-3 md:grid-cols-2">
                {approvalHash ? (
                  <TxLinkCard
                    hash={approvalHash}
                    href={buildExplorerUrl(approvalHash, CHAINS.ETHEREUM)}
                    label="Approval Tx"
                  />
                ) : null}
                {routeHash ? (
                  <TxLinkCard
                    hash={routeHash}
                    href={buildExplorerUrl(routeHash, CHAINS.ETHEREUM)}
                    label="Route Tx"
                  />
                ) : null}
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-4 w-48 bg-white/10" />
                <div className="h-20 bg-white/5" />
                <div className="h-20 bg-white/5" />
              </div>
            ) : null}

            {error ? (
              <p className="border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}

            {!isLoading && !error ? (
              chainGroups.length ? (
                <div className="space-y-4">
                  {chainGroups.map((group) => (
                    <div
                      key={group.chainId}
                      className="border border-white/10 bg-black/20"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 bg-[var(--color-accent)]" />
                          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                            {group.chainName}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] uppercase text-zinc-500">
                          {group.assets.length} Assets
                        </span>
                      </div>
                      <div className="divide-y divide-white/10">
                        {group.assets.map((asset) => (
                          <div
                            key={`${group.chainId}:${asset.address}`}
                            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4"
                          >
                            <div>
                              <p className="text-sm font-bold uppercase tracking-tight text-white">
                                {asset.symbol}
                              </p>
                              <p className="font-mono text-[10px] uppercase text-zinc-500">
                                {asset.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm text-white">{asset.amountDisplay}</p>
                              <p className="font-mono text-[10px] text-zinc-500">
                                {asset.usdDisplay}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
                  No wallet assets detected yet. If the protocol position does not mint a wallet token immediately, check the protocol dashboard as well.
                </p>
              )
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function SnapshotCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg text-white">{value}</p>
    </div>
  );
}

function TxLinkCard({
  hash,
  href,
  label,
}: {
  hash: Hash;
  href: string;
  label: string;
}) {
  return (
    <a
      className="block border border-white/10 bg-white/5 p-4 transition hover:border-[var(--color-accent)]/40"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-white">
        {hash.slice(0, 10)}...{hash.slice(-6)}
      </p>
    </a>
  );
}

function buildExplorerUrl(hash: Hash, chainId: number) {
  const explorerByChainId: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    56: "https://bscscan.com/tx/",
    137: "https://polygonscan.com/tx/",
    42161: "https://arbiscan.io/tx/",
    8453: "https://basescan.org/tx/",
    43114: "https://snowtrace.io/tx/",
    59144: "https://lineascan.build/tx/",
  };

  return `${explorerByChainId[chainId] ?? "https://etherscan.io/tx/"}${hash}`;
}

function formatChainLabel(chainId: number) {
  const labels: Record<number, string> = {
    1: "Ethereum (1)",
    10: "Optimism (10)",
    56: "BNB Chain (56)",
    137: "Polygon (137)",
    42161: "Arbitrum (42161)",
    8453: "Base (8453)",
    43114: "Avalanche (43114)",
    59144: "Linea (59144)",
  };

  return labels[chainId] ?? `Chain ${chainId}`;
}

function shortenAddress(address: string) {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="text-right font-mono text-[11px] text-white">{value}</span>
    </div>
  );
}
