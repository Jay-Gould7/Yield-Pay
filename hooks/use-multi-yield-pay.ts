"use client";

import { useCallback, useState } from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import type { AssetQuoteSelection } from "@/components/home/asset-inventory";
import { UI } from "@/lib/constants";

import {
  fetchYieldPayQuote,
  type UseYieldPayParams,
  type YieldPayResult,
} from "./useYieldPay";

export type MultiYieldPayQuote = {
  error: string | null;
  selection: AssetQuoteSelection;
  status: "error" | "ready";
  value: YieldPayResult | null;
};

type MultiYieldPayState = {
  error: string | null;
  isLoading: boolean;
  quotes: MultiYieldPayQuote[];
};

export function useMultiYieldPay(initialParams: Partial<UseYieldPayParams> = {}) {
  const { address } = useAccount();
  const [state, setState] = useState<MultiYieldPayState>({
    error: null,
    isLoading: false,
    quotes: [],
  });

  const refresh = useCallback(
    async (selections: AssetQuoteSelection[]) => {
      if (!selections.length) {
        setState({
          error: null,
          isLoading: false,
          quotes: [],
        });
        return [];
      }

      setState((current) => ({
        ...current,
        error: null,
        isLoading: true,
      }));

      const results = await Promise.all(
        selections.map(async (selection) => {
          try {
            const value = await fetchYieldPayQuote(
              {
                ...initialParams,
                amount: selection.amount,
                fromChainId: selection.chainId,
                fromTokenAddress: selection.tokenAddress as Address,
                fromTokenDecimals: selection.tokenDecimals,
                fromTokenSymbol: selection.tokenSymbol,
                slippage: initialParams.slippage ?? UI.DEFAULT_SLIPPAGE,
              },
              address as Address | undefined,
            );

            return {
              error: null,
              selection,
              status: "ready" as const,
              value,
            };
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : "Unable to fetch quote.",
              selection,
              status: "error" as const,
              value: null,
            };
          }
        }),
      );

      const readyQuotes = results.filter((item) => item.status === "ready");
      const errorCount = results.length - readyQuotes.length;

      setState({
        error:
          errorCount > 0
            ? `${errorCount} of ${results.length} quote requests failed.`
            : null,
        isLoading: false,
        quotes: results,
      });

      return results;
    },
    [address, initialParams],
  );

  const reset = useCallback(() => {
    setState({
      error: null,
      isLoading: false,
      quotes: [],
    });
  }, []);

  return {
    error: state.error,
    isLoading: state.isLoading,
    quotes: state.quotes,
    refresh,
    reset,
  };
}
