"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useWalletAssets } from "@/hooks/use-wallet-assets";

type AssetKey = `${number}:${string}`;

export type AssetQuoteSelection = {
  amount: string;
  availableAmount: string;
  chainId: number;
  tokenAddress: string;
  tokenDecimals: number;
  tokenName: string;
  tokenSymbol: string;
};

type AssetInventoryProps = {
  onSelectionChange?: (selection: AssetQuoteSelection[]) => void;
};

type DrawerPosition = {
  left: number;
  top: number;
  width: number;
};

function subscribeToHydration() {
  return () => undefined;
}

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export function AssetInventory({ onSelectionChange }: AssetInventoryProps) {
  const { assetCount, chainGroups, error, isConnected, isLoading, totalUsd } =
    useWalletAssets();
  const hasHydrated = useHasHydrated();
  const [investmentAmounts, setInvestmentAmounts] = useState<Record<string, string>>({});
  const [hoveredChainId, setHoveredChainId] = useState<number | null>(null);
  const [drawerPosition, setDrawerPosition] = useState<DrawerPosition | null>(null);
  const [selectedAssetKeys, setSelectedAssetKeys] = useState<AssetKey[]>([]);
  const lastEmittedSelectionKeyRef = useRef<string | null>(null);
  const chainRowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }

    const emitSelection = (selection: AssetQuoteSelection[]) => {
      const selectionKey = JSON.stringify(selection);

      if (selectionKey === lastEmittedSelectionKeyRef.current) {
        return;
      }

      lastEmittedSelectionKeyRef.current = selectionKey;
      onSelectionChange(selection);
    };

    if (!hasHydrated || !isConnected || !chainGroups.length) {
      emitSelection([]);
      return;
    }

    const selections: AssetQuoteSelection[] = [];

    for (const group of chainGroups) {
      for (const asset of group.assets) {
        const assetKey = `${group.chainId}:${asset.address}` as AssetKey;

        if (!selectedAssetKeys.includes(assetKey)) {
          continue;
        }

        selections.push({
          amount: investmentAmounts[assetKey] ?? "",
          availableAmount: asset.amountExact,
          chainId: asset.chainId,
          tokenAddress: asset.address,
          tokenDecimals: asset.decimals,
          tokenName: asset.name,
          tokenSymbol: asset.symbol,
        });
      }
    }

    emitSelection(selections);
  }, [chainGroups, hasHydrated, investmentAmounts, isConnected, onSelectionChange, selectedAssetKeys]);

  const hoveredGroup = useMemo(
    () => chainGroups.find((group) => group.chainId === hoveredChainId) ?? null,
    [chainGroups, hoveredChainId],
  );

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const openDrawerForChain = (chainId: number) => {
    clearCloseTimeout();
    setHoveredChainId(chainId);

    const node = chainRowRefs.current[chainId];

    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    setDrawerPosition({
      left: rect.left,
      top: rect.bottom,
      width: rect.width,
    });
  };

  const scheduleDrawerClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setHoveredChainId(null);
      setDrawerPosition(null);
    }, 120);
  };

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  useEffect(() => {
    if (hoveredChainId === null) {
      return;
    }

    const updateDrawerPosition = () => {
      const node = chainRowRefs.current[hoveredChainId];

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      setDrawerPosition({
        left: rect.left,
        top: rect.bottom,
        width: rect.width,
      });
    };

    updateDrawerPosition();
    window.addEventListener("resize", updateDrawerPosition);
    window.addEventListener("scroll", updateDrawerPosition, true);

    return () => {
      window.removeEventListener("resize", updateDrawerPosition);
      window.removeEventListener("scroll", updateDrawerPosition, true);
    };
  }, [hoveredChainId]);

  const showConnectedState = hasHydrated && isConnected;

  return (
    <section className="overflow-hidden border border-white/10 bg-[var(--color-panel-2)] lg:col-span-8">
      <div className="flex items-center justify-between border-b border-white/10 bg-[var(--color-panel-3)] px-6 py-4">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">
          Idle Asset Inventory
        </span>
        <span className="font-mono text-[10px] uppercase text-zinc-500">
          {showConnectedState ? `${assetCount} Assets // ${totalUsd.toLocaleString("en-US", {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })} USD` : "Wallet Offline"}
        </span>
      </div>

      {!showConnectedState ? (
        <div className="px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Awaiting wallet handshake
          </p>
          <p className="mt-3 max-w-xl text-sm text-zinc-400">
            Connect your wallet to inspect live balances from LI.FI and classify idle assets by chain.
          </p>
        </div>
      ) : null}

      {showConnectedState && isLoading ? (
        <div className="space-y-4 px-6 py-8">
          <div className="h-4 w-40 bg-white/10" />
          <div className="h-20 bg-white/5" />
          <div className="h-20 bg-white/5" />
        </div>
      ) : null}

      {showConnectedState && error ? (
        <div className="px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-danger)]">
            Asset scan failed
          </p>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">{error}</p>
        </div>
      ) : null}

      {showConnectedState && !isLoading && !error ? (
        <div className="divide-y divide-white/10">
          {chainGroups.length ? (
            chainGroups.map((group) => {
              return (
                <div
                  key={group.chainId}
                  ref={(node) => {
                    chainRowRefs.current[group.chainId] = node;
                  }}
                  onMouseEnter={() => openDrawerForChain(group.chainId)}
                  onMouseLeave={scheduleDrawerClose}
                >
                  <div className="flex w-full items-center justify-between bg-black/20 px-6 py-3 text-left transition hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-[var(--color-accent)]" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                        {group.chainName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] uppercase text-zinc-500">
                        {group.assets.length} Assets // {group.totalUsd.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })} USD
                      </span>
                      <span className="font-mono text-[10px] uppercase text-zinc-500">
                        Hover for assets
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-10">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                No funded assets detected
              </p>
            </div>
          )}
        </div>
      ) : null}
      {hasHydrated && hoveredGroup && drawerPosition
        ? createPortal(
            <div
              className="fixed z-[120] border-y border-white/10 bg-black/95 shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-all duration-200"
              onMouseEnter={clearCloseTimeout}
              onMouseLeave={scheduleDrawerClose}
              style={{
                left: drawerPosition.left,
                top: drawerPosition.top,
                width: drawerPosition.width,
              }}
            >
              {hoveredGroup.assets.map((asset) => {
                const assetKey =
                  `${hoveredGroup.chainId}:${asset.address}` as AssetKey;
                const isSelected = selectedAssetKeys.includes(assetKey);

                return (
                  <div
                    key={assetKey}
                    className={`grid grid-cols-[auto_auto_minmax(0,1fr)_minmax(160px,220px)_auto] items-center gap-4 px-6 py-6 transition-colors hover:bg-white/5 ${
                      isSelected ? "bg-[var(--color-accent)]/5" : ""
                    }`}
                  >
                    <input
                      aria-label={`${asset.symbol} selected`}
                      className="h-5 w-5 rounded-none border border-white/30 bg-transparent accent-[var(--color-accent)]"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedAssetKeys((current) =>
                          current.includes(assetKey)
                            ? current.filter((key) => key !== assetKey)
                            : [...current, assetKey],
                        );
                      }}
                      type="checkbox"
                    />
                    <div className="flex h-10 w-10 items-center justify-center bg-white/5 font-mono text-xs text-[var(--color-accent)]">
                      {asset.symbol}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold uppercase tracking-tight">
                        {asset.symbol}
                      </div>
                      <div className="font-mono text-[10px] uppercase text-zinc-500">
                        {asset.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{asset.amountDisplay}</div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {asset.usdDisplay}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`${asset.symbol} investment amount`}
                        className={`w-full border px-3 py-3 font-mono text-sm text-white outline-none transition placeholder:text-zinc-600 ${
                          isSelected
                            ? "border-[var(--color-accent)]/40 bg-black/60"
                            : "border-white/10 bg-white/5"
                        }`}
                        inputMode="decimal"
                        onChange={(event) => {
                          setSelectedAssetKeys((current) =>
                            current.includes(assetKey) ? current : [...current, assetKey],
                          );
                          setInvestmentAmounts((current) => ({
                            ...current,
                            [assetKey]: event.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        type="text"
                        value={investmentAmounts[assetKey] ?? ""}
                      />
                      <button
                        aria-label={`Max ${asset.symbol}`}
                        className="border border-white/20 px-3 py-3 font-mono text-[10px] uppercase transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                        onClick={() => {
                          setSelectedAssetKeys((current) =>
                            current.includes(assetKey) ? current : [...current, assetKey],
                          );
                          setInvestmentAmounts((current) => ({
                            ...current,
                            [assetKey]: asset.amountExact,
                          }));
                        }}
                        type="button"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
