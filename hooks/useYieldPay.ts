"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import { parseUnits, type Address } from "viem";
import { useAccount } from "wagmi";

import { CHAINS, TOKENS, UI } from "@/lib/constants";

export type YieldPaySourceToken = "USDC" | "ETH" | "MATIC" | "BNB" | "AVAX";

export type UseYieldPayParams = {
  amount?: string;
  fromChainId?: number;
  toChainId?: number;
  fromTokenSymbol?: YieldPaySourceToken;
  fromTokenAddress?: Address;
  fromTokenDecimals?: number;
  fromAddress?: Address;
  toAddress?: Address;
  targetAsset?: string;
  targetProtocol?: string;
  targetVaultAddress?: Address;
  minTvlUsd?: number;
  vaultLimit?: number;
  slippage?: number;
  principalUsdOverride?: number;
};

type EarnVaultProtocol = {
  name: string;
};

type EarnVaultAnalytics = {
  apy: {
    total: number;
  };
  apy30d?: number;
  tvl: {
    usd: number | string;
  };
};

export type YieldPayVault = {
  address: Address;
  name: string;
  chainId: number;
  isTransactional: boolean;
  protocol: EarnVaultProtocol;
  analytics: EarnVaultAnalytics;
};

type EarnVaultResponse =
  | YieldPayVault[]
  | {
      data?: YieldPayVault[];
    };

type QuoteCost = {
  amountUSD?: string;
};

type QuoteToken = {
  address: Address;
  decimals: number;
  name?: string;
  priceUSD?: string;
  symbol?: string;
};

type QuoteTransactionRequest = {
  chainId?: number;
  data?: `0x${string}`;
  from?: Address;
  gasLimit?: string;
  gasPrice?: string;
  to: Address;
  value?: string;
};

type QuoteResponse = {
  action: {
    fromAddress?: Address;
    fromAmount: string;
    fromToken?: QuoteToken;
    toAddress?: Address;
  };
  estimate: {
    approvalAddress?: Address;
    feeCosts?: QuoteCost[];
    gasCosts?: QuoteCost[];
  };
  id?: string;
  transactionRequest?: QuoteTransactionRequest;
};

type ResolvedSourceToken = {
  address: Address;
  decimals: number;
  isNative: boolean;
  symbol: YieldPaySourceToken;
};

export type YieldPayResult = {
  amount: string;
  amountAtomic: string;
  approvalAddress: Address | null;
  apyDecimal: number;
  apyPercent: number;
  availableVaults: YieldPayVault[];
  breakEvenDays: number;
  fromAddress: Address;
  fromChainId: number;
  fromToken: ResolvedSourceToken;
  principalUsd: number;
  quoteId: string | null;
  selectedVault: YieldPayVault;
  toAddress: Address;
  toChainId: number;
  totalFeesUsd: number;
  transactionRequest: QuoteTransactionRequest;
};

type UseYieldPayState = {
  data: YieldPayResult | null;
  error: string | null;
  isLoading: boolean;
};

const USDC_SOURCE_TOKENS_BY_CHAIN: Partial<Record<number, ResolvedSourceToken>> = {
  [CHAINS.ARBITRUM]: {
    address: TOKENS.USDC_ARB as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.AVALANCHE]: {
    address: TOKENS.USDC_AVAX as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.BASE]: {
    address: TOKENS.USDC_BASE as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.BSC]: {
    address: TOKENS.USDC_BSC as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.ETHEREUM]: {
    address: TOKENS.USDC_ETH as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.OPTIMISM]: {
    address: TOKENS.USDC_OP as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
  [CHAINS.POLYGON]: {
    address: TOKENS.USDC_POL as Address,
    decimals: 6,
    isNative: false,
    symbol: "USDC",
  },
};

const NATIVE_SOURCE_TOKENS: Record<Exclude<YieldPaySourceToken, "USDC">, ResolvedSourceToken> = {
  AVAX: {
    address: TOKENS.AVAX as Address,
    decimals: 18,
    isNative: true,
    symbol: "AVAX",
  },
  BNB: {
    address: TOKENS.BNB as Address,
    decimals: 18,
    isNative: true,
    symbol: "BNB",
  },
  ETH: {
    address: TOKENS.ETH as Address,
    decimals: 18,
    isNative: true,
    symbol: "ETH",
  },
  MATIC: {
    address: TOKENS.MATIC as Address,
    decimals: 18,
    isNative: true,
    symbol: "MATIC",
  },
};

const publicApiKey = process.env.NEXT_PUBLIC_LIFI_API_KEY;

function getRequestHeaders() {
  return publicApiKey ? { "x-lifi-api-key": publicApiKey } : undefined;
}

function normalizeProtocolName(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function parseUsd(value?: string | number | null) {
  const parsed =
    typeof value === "number" ? value : value ? Number.parseFloat(value) : 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function sumQuoteCosts(costs?: QuoteCost[]) {
  return (costs ?? []).reduce((total, cost) => total + parseUsd(cost.amountUSD), 0);
}

function normalizeVaults(response: EarnVaultResponse) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function resolveSourceToken(params: UseYieldPayParams): ResolvedSourceToken {
  if (params.fromTokenAddress && params.fromTokenDecimals !== undefined) {
    return {
      address: params.fromTokenAddress,
      decimals: params.fromTokenDecimals,
      isNative: params.fromTokenAddress.toLowerCase() === TOKENS.ETH.toLowerCase(),
      symbol: params.fromTokenSymbol ?? "USDC",
    };
  }

  if ((params.fromTokenSymbol ?? "USDC") === "USDC") {
    return (
      USDC_SOURCE_TOKENS_BY_CHAIN[params.fromChainId ?? CHAINS.BASE] ??
      USDC_SOURCE_TOKENS_BY_CHAIN[CHAINS.BASE]
    ) as ResolvedSourceToken;
  }

  return NATIVE_SOURCE_TOKENS[(params.fromTokenSymbol ?? "ETH") as Exclude<YieldPaySourceToken, "USDC">];
}

function formatAxiosError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Unknown request error";
  }

  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  const responseMessage =
    axiosError.response?.data?.message ?? axiosError.response?.data?.error;

  return responseMessage ?? axiosError.message;
}

export async function fetchYieldPayQuote(
  params: UseYieldPayParams,
  fallbackAddress?: Address,
) {
  const userAddress = (params.fromAddress ?? fallbackAddress) as Address | undefined;

  if (!userAddress) {
    throw new Error("A connected wallet address is required to request a quote.");
  }

  const recipientAddress = (params.toAddress ?? userAddress) as Address;
  const sourceToken = resolveSourceToken(params);
  const amount = params.amount ?? "0.02";
  const amountAtomic = parseUnits(amount, sourceToken.decimals).toString();

  const earnParams = new URLSearchParams({
    asset: params.targetAsset ?? "USDC",
    chainId: String(params.toChainId ?? CHAINS.BASE),
    limit: String(params.vaultLimit ?? 5),
    minTvlUsd: String(params.minTvlUsd ?? 100000),
    sortBy: "apy",
  });

  const earnResponse = await axios.get<EarnVaultResponse>(
    `/api/lifi/earn-vaults?${earnParams.toString()}`,
    {
      headers: getRequestHeaders(),
    },
  );

  const availableVaults = normalizeVaults(earnResponse.data).filter(
    (vault) => vault.isTransactional,
  );

  if (availableVaults.length === 0) {
    throw new Error("No depositable vaults were returned for the requested asset.");
  }

  const requestedVaultAddress = params.targetVaultAddress?.toLowerCase();
  const requestedProtocol = normalizeProtocolName(params.targetProtocol);

  const selectedVault =
    availableVaults.find(
      (vault) => vault.address.toLowerCase() === requestedVaultAddress,
    ) ??
    availableVaults.find((vault) => {
      const protocolName = normalizeProtocolName(vault.protocol.name);
      const vaultName = normalizeProtocolName(vault.name);

      return requestedProtocol
        ? protocolName.includes(requestedProtocol) ||
            vaultName.includes(requestedProtocol)
        : false;
    }) ??
    availableVaults[0];

  if (!selectedVault) {
    throw new Error("Unable to resolve a target vault for the current request.");
  }

  const quoteResponse = await axios.get<QuoteResponse>("/api/lifi/quote", {
    params: {
      fromAddress: userAddress,
      fromAmount: amountAtomic,
      fromChain: params.fromChainId ?? CHAINS.BASE,
      fromToken: sourceToken.address,
      slippage: params.slippage ?? UI.DEFAULT_SLIPPAGE,
      toAddress: recipientAddress,
      toChain: params.toChainId ?? CHAINS.BASE,
      toToken: selectedVault.address,
    },
  });

  const quote = quoteResponse.data;
  const totalFeesUsd =
    sumQuoteCosts(quote.estimate.feeCosts) + sumQuoteCosts(quote.estimate.gasCosts);

  if (!quote.transactionRequest) {
    throw new Error("Quote response did not include a transactionRequest.");
  }

  const tokenPriceUsd =
    quote.action.fromToken?.priceUSD ??
    (sourceToken.symbol === "USDC" ? "1" : undefined);
  const principalUsd =
    params.principalUsdOverride ??
    Number.parseFloat(amount) * parseUsd(tokenPriceUsd);

  if (!Number.isFinite(principalUsd) || principalUsd <= 0) {
    throw new Error("Unable to calculate principal USD for the current quote.");
  }

  const apyDecimal = normalizeApyDecimal(selectedVault.analytics.apy.total);
  const breakEvenDays = totalFeesUsd / (principalUsd * (apyDecimal / 365));

  return {
    amount,
    amountAtomic,
    approvalAddress: quote.estimate.approvalAddress ?? null,
    apyDecimal,
    apyPercent: apyDecimal * 100,
    availableVaults,
    breakEvenDays,
    fromAddress: userAddress,
    fromChainId: params.fromChainId ?? CHAINS.BASE,
    fromToken: sourceToken,
    principalUsd,
    quoteId: quote.id ?? null,
    selectedVault,
    toAddress: recipientAddress,
    toChainId: params.toChainId ?? CHAINS.BASE,
    totalFeesUsd,
    transactionRequest: quote.transactionRequest,
  } satisfies YieldPayResult;
}

export function useYieldPay(initialParams: UseYieldPayParams = {}) {
  const { address, isConnected } = useAccount();
  const initialParamsRef = useRef(initialParams);
  const [state, setState] = useState<UseYieldPayState>({
    data: null,
    error: null,
    isLoading: false,
  });
  const latestRequestId = useRef(0);

  useEffect(() => {
    initialParamsRef.current = initialParams;
  }, [initialParams]);

  const refresh = useCallback(async (overrides: Partial<UseYieldPayParams> = {}) => {
    const params: UseYieldPayParams = {
      amount: "0.02",
      fromChainId: CHAINS.BASE,
      toChainId: CHAINS.BASE,
      fromTokenSymbol: "USDC",
      targetAsset: "USDC",
      minTvlUsd: 100000,
      vaultLimit: 5,
      slippage: UI.DEFAULT_SLIPPAGE,
      ...initialParamsRef.current,
      ...overrides,
    };

    const requestId = ++latestRequestId.current;

    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const nextResult = await fetchYieldPayQuote(
        params,
        address as Address | undefined,
      );

      if (latestRequestId.current === requestId) {
        setState({
          data: nextResult,
          error: null,
          isLoading: false,
        });
      }

      return nextResult;
    } catch (error) {
      const message = formatAxiosError(error);

      if (latestRequestId.current === requestId) {
        setState((current) => ({
          ...current,
          error: message,
          isLoading: false,
        }));
      }

      return null;
    }
  }, [address]);

  const reset = useCallback(() => {
    latestRequestId.current += 1;
    setState((current) => {
      if (!current.data && !current.error && !current.isLoading) {
        return current;
      }

      return {
        data: null,
        error: null,
        isLoading: false,
      };
    });
  }, []);

  return {
    address,
    data: state.data,
    error: state.error,
    isConnected,
    isLoading: state.isLoading,
    refresh,
    reset,
  };
}

function normalizeApyDecimal(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value > 1 ? value / 100 : value;
}
