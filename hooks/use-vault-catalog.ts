"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { CHAINS } from "@/lib/constants";
import type { Vault } from "@/lib/types";
import {
  buildVaultCatalog,
  type EarnVaultCatalogEntry,
} from "@/lib/vault-catalog";

type EarnVaultResponse =
  | EarnVaultCatalogEntry[]
  | {
      data?: EarnVaultCatalogEntry[];
    };

type DiscoveryRequest = {
  asset: string;
  chainId: number;
};

type VaultCatalogState = {
  error: string | null;
  isLoading: boolean;
  vaults: Vault[];
};

const discoveryRequests: DiscoveryRequest[] = [
  { asset: "ETH", chainId: CHAINS.ETHEREUM },
  { asset: "USDC", chainId: CHAINS.ETHEREUM },
  { asset: "USDT", chainId: CHAINS.ETHEREUM },
  { asset: "USDC", chainId: CHAINS.BASE },
  { asset: "USDC", chainId: CHAINS.ARBITRUM },
  { asset: "USDC", chainId: CHAINS.OPTIMISM },
];

export function useVaultCatalog(fallbackVaults: Vault[]) {
  const [state, setState] = useState<VaultCatalogState>(() => ({
    error: null,
    isLoading: true,
    vaults: fallbackVaults,
  }));
  const fallbackVaultsRef = useRef(fallbackVaults);
  const fallbackVaultsKey = useMemo(
    () => fallbackVaults.map((vault) => vault.id).join("|"),
    [fallbackVaults],
  );

  useEffect(() => {
    fallbackVaultsRef.current = fallbackVaults;
  }, [fallbackVaults]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const responses = await Promise.allSettled(
          discoveryRequests.map(async ({ asset, chainId }) => {
            const params = new URLSearchParams({
              asset,
              chainId: String(chainId),
              limit: "24",
              minTvlUsd: "100000",
              sortBy: "apy",
            });

            const response = await axios.get<EarnVaultResponse>(
              `/api/lifi/earn-vaults?${params.toString()}`,
            );

            return normalizeResponse(response.data).map((vault) => ({
              ...vault,
              asset,
              chainId,
            }));
          }),
        );

        const entries = responses.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        );
        const liveVaults = buildVaultCatalog(entries);

        if (!liveVaults.length) {
          throw new Error("LI.FI Earn vault catalog is temporarily unavailable.");
        }

        if (!cancelled) {
          setState({
            error: null,
            isLoading: false,
            vaults: liveVaults,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load LI.FI Earn vaults.",
            isLoading: false,
            vaults: fallbackVaultsRef.current,
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fallbackVaultsKey]);

  return useMemo(
    () => ({
      error: state.error,
      isLoading: state.isLoading,
      vaults: state.vaults,
    }),
    [state.error, state.isLoading, state.vaults],
  );
}

function normalizeResponse(response: EarnVaultResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}
