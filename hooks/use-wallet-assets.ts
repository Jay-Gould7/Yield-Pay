"use client";

import { getWalletBalances } from "@lifi/sdk";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

import "@/app/config/lifi";
import { supportedChains } from "@/app/config/wagmi";
import { sourceChains } from "@/lib/home-data";

type WalletAsset = {
  address: string;
  amountDisplay: string;
  amountExact: string;
  amountRaw: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  usdDisplay: string;
  usdValue: number;
};

type WalletAssetGroup = {
  assets: WalletAsset[];
  chainId: number;
  chainName: string;
  totalUsd: number;
};

type UseWalletAssetsResult = {
  activeChainId?: number;
  assetCount: number;
  chainGroups: WalletAssetGroup[];
  error: string | null;
  isConnected: boolean;
  isLoading: boolean;
  totalUsd: number;
};

type WalletAssetsState = {
  assetCount: number;
  chainGroups: WalletAssetGroup[];
  error: string | null;
  requestKey: string | null;
  totalUsd: number;
};

type WalletBalanceToken = {
  address: string;
  amount: string;
  chainId: number;
  decimals: number;
  name: string;
  priceUSD?: string;
  symbol: string;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

const configuredChainNameById = new Map<number, string>(
  supportedChains.map((chain) => [chain.id, chain.name]),
);
const preferredChainNameById = new Map<number, string>(
  sourceChains.map((chain) => [chain.chainId, chain.label]),
);

function formatUsd(value: number) {
  return currencyFormatter.format(value);
}

function formatTokenAmount(amount: string, decimals: number) {
  const normalized = Number(formatUnits(BigInt(amount), decimals));

  if (!Number.isFinite(normalized)) {
    return "0";
  }

  if (normalized >= 1000) {
    return amountFormatter.format(normalized);
  }

  if (normalized >= 1) {
    return normalized.toLocaleString("en-US", {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    });
  }

  if (normalized > 0 && normalized < 0.000001) {
    return "<0.000001";
  }

  return normalized.toLocaleString("en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load wallet assets.";
}

export function useWalletAssets(): UseWalletAssetsResult {
  const { address, chainId, isConnected } = useAccount();
  const requestKey = isConnected && address ? `${address}:${chainId ?? "unknown"}` : null;
  const [state, setState] = useState<WalletAssetsState>({
    assetCount: 0,
    chainGroups: [],
    error: null,
    requestKey: null,
    totalUsd: 0,
  });

  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    let cancelled = false;

    void getWalletBalances(address)
      .then((balances) => {
        if (cancelled) {
          return;
        }

        const groups = Object.entries(balances)
          .map(([groupChainId, tokens]) => {
            const numericChainId = Number(groupChainId);
            const assets = (tokens as WalletBalanceToken[])
              .map((token) => {
                const usdValue =
                  Number(formatUnits(BigInt(token.amount), token.decimals)) *
                  Number(token.priceUSD ?? 0);

                return {
                  address: token.address,
                  amountDisplay: formatTokenAmount(token.amount, token.decimals),
                  amountExact: formatUnits(BigInt(token.amount), token.decimals),
                  amountRaw: token.amount,
                  chainId: numericChainId,
                  decimals: token.decimals,
                  name: token.name,
                  symbol: token.symbol,
                  usdDisplay: formatUsd(usdValue),
                  usdValue,
                } satisfies WalletAsset;
              })
              .filter((asset) => asset.usdValue > 0 || BigInt(asset.amountRaw) > BigInt(0))
              .sort((left, right) => right.usdValue - left.usdValue);

            const totalUsd = assets.reduce((sum, asset) => sum + asset.usdValue, 0);

            return {
              assets,
              chainId: numericChainId,
              chainName:
                preferredChainNameById.get(numericChainId) ??
                configuredChainNameById.get(numericChainId) ??
                `Chain ${numericChainId}`,
              totalUsd,
            } satisfies WalletAssetGroup;
          })
          .filter((group) => group.assets.length > 0)
          .sort((left, right) => {
            if (left.chainId === chainId) {
              return -1;
            }

            if (right.chainId === chainId) {
              return 1;
            }

            return right.totalUsd - left.totalUsd;
          });

        const assetCount = groups.reduce((sum, group) => sum + group.assets.length, 0);
        const totalUsd = groups.reduce((sum, group) => sum + group.totalUsd, 0);

        setState({
          assetCount,
          chainGroups: groups,
          error: null,
          requestKey,
          totalUsd,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setState({
          assetCount: 0,
          chainGroups: [],
          error: normalizeError(error),
          requestKey,
          totalUsd: 0,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [address, chainId, isConnected, requestKey]);

  if (!isConnected || !address) {
    return {
      activeChainId: chainId,
      assetCount: 0,
      chainGroups: [],
      error: null,
      isConnected: false,
      isLoading: false,
      totalUsd: 0,
    };
  }

  const isLoading = state.requestKey !== requestKey;

  return {
    activeChainId: chainId,
    assetCount: isLoading ? 0 : state.assetCount,
    chainGroups: isLoading ? [] : state.chainGroups,
    error: isLoading ? null : state.error,
    isConnected: true,
    isLoading,
    totalUsd: isLoading ? 0 : state.totalUsd,
  };
}
