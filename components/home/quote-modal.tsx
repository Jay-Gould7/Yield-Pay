"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CircleDashed, RefreshCcw, X } from "lucide-react";
import { erc20Abi, type Address, type Hash } from "viem";
import { getPublicClient } from "@wagmi/core";
import {
  useAccount,
  useConnectorClient,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

import { config as wagmiConfig } from "@/app/config/wagmi";
import type { AssetQuoteSelection } from "@/components/home/asset-inventory";
import { HoldingsModal } from "@/components/home/holdings-modal";
import { useMultiYieldPay } from "@/hooks/use-multi-yield-pay";
import { useYieldPay } from "@/hooks/useYieldPay";
import { formatBreakEvenWindow, formatUsd } from "@/lib/calculations";
import { CHAINS } from "@/lib/constants";
import { useWalletUi } from "@/lib/wallet/ui-context";

type QuoteModalProps = {
  composerTargetApyDecimal?: number;
  composerTargetName?: string;
  composerTargetTokenAddress?: string;
  isOpen: boolean;
  onClose: () => void;
  selections: AssetQuoteSelection[];
  vaultLabel: string;
  vaultSubtitle: string;
  targetAsset: string;
  targetChainId: number;
  targetProtocol: string;
  targetVaultAddress?: string;
};

type ExecutionStep = "wallet" | "quote" | "approval" | "route" | "done";
type PendingReceipt = {
  chainId: number;
  hash: Hash;
  step: "approval" | "route";
};
type ExecutionState = {
  approvalHash: Hash | null;
  error: string | null;
  isConfirmed: boolean;
  pendingReceipt: PendingReceipt | null;
  routeHash: Hash | null;
  runningStep: ExecutionStep | null;
};

const executionOrder: ExecutionStep[] = ["wallet", "quote", "approval", "route", "done"];

export function QuoteModal({
  composerTargetApyDecimal,
  composerTargetName,
  composerTargetTokenAddress,
  isOpen,
  onClose,
  selections,
  vaultLabel,
  vaultSubtitle,
  targetAsset,
  targetChainId,
  targetProtocol,
  targetVaultAddress,
}: QuoteModalProps) {
  const { evmAddress, connectEvm, open } = useWalletUi();
  const { address: accountAddress, chainId } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const { data, error, isLoading, refresh, reset } = useYieldPay();
  const multiQuoteBaseParams = useMemo(
    () => ({
      composerTargetApyDecimal,
      composerTargetName,
      composerTargetTokenAddress: composerTargetTokenAddress as Address | undefined,
      targetAsset,
      targetProtocol,
      targetVaultAddress: targetVaultAddress as Address | undefined,
      toChainId: targetChainId,
    }),
    [
      composerTargetApyDecimal,
      composerTargetName,
      composerTargetTokenAddress,
      targetAsset,
      targetChainId,
      targetProtocol,
      targetVaultAddress,
    ],
  );
  const {
    error: multiError,
    isLoading: isMultiLoading,
    quotes: multiQuotes,
    refresh: refreshMultiQuotes,
    reset: resetMultiQuotes,
  } = useMultiYieldPay(multiQuoteBaseParams);
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const [execution, setExecution] = useState<ExecutionState>({
    approvalHash: null,
    error: null,
    isConfirmed: false,
    pendingReceipt: null,
    routeHash: null,
    runningStep: null,
  });
  const [isHoldingsOpen, setIsHoldingsOpen] = useState(false);

  const walletAddress = (accountAddress ?? evmAddress ?? undefined) as Address | undefined;
  const connectorClientRef = useRef(connectorClient ?? null);
  const validSelections = useMemo(
    () =>
      selections.filter((selection) => {
        const amountValue = Number(selection.amount);
        return Number.isFinite(amountValue) && amountValue > 0;
      }),
    [selections],
  );
  const isMultiInput = validSelections.length > 1;
  const primarySelection = validSelections[0] ?? null;
  const quoteRequestParams = useMemo(
    () =>
      primarySelection
        ? {
            amount: primarySelection.amount,
            composerTargetApyDecimal,
            composerTargetName,
            composerTargetTokenAddress: composerTargetTokenAddress as Address | undefined,
            fromChainId: primarySelection.chainId,
            fromTokenAddress: primarySelection.tokenAddress as Address,
            fromTokenDecimals: primarySelection.tokenDecimals,
            fromTokenSymbol: primarySelection.tokenSymbol,
            targetAsset,
            targetProtocol,
            targetVaultAddress: targetVaultAddress as Address | undefined,
            toChainId: targetChainId,
          }
        : null,
    [
      composerTargetApyDecimal,
      composerTargetName,
      composerTargetTokenAddress,
      primarySelection,
      targetAsset,
      targetChainId,
      targetProtocol,
      targetVaultAddress,
    ],
  );

  const phaseStates = useMemo(() => {
    const activeIndex =
      execution.runningStep === null ? -1 : executionOrder.indexOf(execution.runningStep);

    return executionOrder.map((step, index) => ({
      id: step,
      status:
        step === "done" && execution.isConfirmed
          ? "done"
          : activeIndex === -1
            ? "idle"
            : index < activeIndex
              ? "done"
              : index === activeIndex
                ? "active"
                : "idle",
      title:
        step === "approval" && execution.pendingReceipt?.step === "approval"
          ? "Approval Submitted"
          : step === "route" && execution.pendingReceipt?.step === "route"
            ? "Route Submitted"
            : executionTitleByStep[step],
    }));
  }, [execution.isConfirmed, execution.pendingReceipt?.step, execution.runningStep]);

  useEffect(() => {
    connectorClientRef.current = connectorClient ?? null;
  }, [connectorClient]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setExecution({
        approvalHash: null,
        error: null,
        isConfirmed: false,
        pendingReceipt: null,
        routeHash: null,
        runningStep: null,
      });
      setIsHoldingsOpen(false);
      resetMultiQuotes();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, reset, resetMultiQuotes]);

  useEffect(() => {
    if (!isOpen || !walletAddress || !primarySelection || isMultiInput) {
      return;
    }

    setExecution((current) => {
      if (
        !current.approvalHash &&
        !current.error &&
        !current.isConfirmed &&
        !current.pendingReceipt &&
        !current.routeHash &&
        current.runningStep === null
      ) {
        return current;
      }

      return {
        approvalHash: null,
        error: null,
        isConfirmed: false,
        pendingReceipt: null,
        routeHash: null,
        runningStep: null,
      };
    });

    const timer = window.setTimeout(() => {
      if (quoteRequestParams) {
        void refresh(quoteRequestParams);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [
    isOpen,
    isMultiInput,
    primarySelection,
    quoteRequestParams,
    refresh,
    walletAddress,
  ]);

  useEffect(() => {
    if (!isOpen || !walletAddress || !isMultiInput || !validSelections.length) {
      return;
    }

    void refreshMultiQuotes(validSelections);
  }, [isMultiInput, isOpen, refreshMultiQuotes, validSelections, walletAddress]);

  const handleRefreshQuote = async () => {
    if (!walletAddress) {
      connectEvm();
      open();
      return;
    }

    if (isMultiInput) {
      if (isMultiLoading || !validSelections.length) {
        return;
      }

      await refreshMultiQuotes(validSelections);
      return;
    }

    if (!quoteRequestParams || isLoading) {
      return;
    }

    setExecution({
      approvalHash: null,
      error: null,
      isConfirmed: false,
      pendingReceipt: null,
      routeHash: null,
      runningStep: null,
    });

    await refresh(quoteRequestParams);
  };

  const submitRoute = useCallback(async ({
    executionChainId,
    quote,
    userAddress,
  }: {
    executionChainId: number;
    quote: NonNullable<typeof data>;
    userAddress: Address;
  }) => {
    setExecution((current) => ({
      ...current,
      error: null,
      isConfirmed: false,
      pendingReceipt: null,
      runningStep: "route",
    }));

    const nextRouteHash = await sendTransactionAsync({
      account: userAddress,
      chainId: executionChainId,
      data: quote.transactionRequest.data,
      gas: toOptionalBigInt(quote.transactionRequest.gasLimit),
      gasPrice: toOptionalBigInt(quote.transactionRequest.gasPrice),
      to: quote.transactionRequest.to,
      value: toOptionalBigInt(quote.transactionRequest.value),
    });

    setExecution((current) => ({
      ...current,
      error: "Route transaction submitted. Waiting for onchain confirmation...",
      isConfirmed: false,
      pendingReceipt: {
        chainId: executionChainId,
        hash: nextRouteHash,
        step: "route",
      },
      routeHash: nextRouteHash,
      runningStep: "route",
    }));
  }, [sendTransactionAsync]);

  const handleExecute = async () => {
    if (isMultiInput) {
      await handleRefreshQuote();
      return;
    }

    if (execution.isConfirmed) {
      setIsHoldingsOpen(true);
      return;
    }

    if (!walletAddress) {
      connectEvm();
      open();
      return;
    }

    if (!data) {
      await handleRefreshQuote();
      return;
    }

    if (execution.runningStep !== null) {
      return;
    }

    setExecution({
      approvalHash: null,
      error: null,
      isConfirmed: false,
      pendingReceipt: null,
      routeHash: null,
      runningStep: "wallet",
    });

    try {
      const executionChainId = data.transactionRequest.chainId ?? data.fromChainId;
      const executionPublicClient = getPublicClient(wagmiConfig, {
        chainId: executionChainId,
      });

      if (!executionPublicClient) {
        throw new Error("Execution public client is unavailable.");
      }

      if (chainId !== executionChainId) {
        await switchChainAsync({ chainId: executionChainId });
      }

      setExecution((current) => ({
        ...current,
        runningStep: "quote",
      }));

      setExecution((current) => ({
        ...current,
        runningStep: "approval",
      }));

      if (!data.fromToken.isNative && data.approvalAddress) {
        const requiredAmount = BigInt(data.amountAtomic);
        let allowance: bigint | null = null;

        try {
          allowance = await executionPublicClient.readContract({
            abi: erc20Abi,
            address: data.fromToken.address,
            args: [walletAddress, data.approvalAddress],
            functionName: "allowance",
          });
        } catch {
          allowance = null;
        }

        if (allowance === null || allowance < requiredAmount) {
          const nextApprovalHash = await writeContractAsync({
            abi: erc20Abi,
            account: walletAddress,
            address: data.fromToken.address,
            args: [data.approvalAddress, requiredAmount],
            chainId: data.fromChainId,
            functionName: "approve",
          });

          setExecution((current) => ({
            ...current,
            approvalHash: nextApprovalHash,
            error: "Approval submitted. Waiting for onchain confirmation...",
            isConfirmed: false,
            pendingReceipt: {
              chainId: executionChainId,
              hash: nextApprovalHash,
              step: "approval",
            },
            runningStep: "approval",
          }));
          return;
        }
      }

      await submitRoute({
        executionChainId,
        quote: data,
        userAddress: walletAddress,
      });
    } catch (caughtError) {
      setExecution((current) => ({
        ...current,
        error: formatExecutionError(caughtError),
        isConfirmed: false,
        pendingReceipt: null,
        runningStep: null,
      }));
    }
  };

  useEffect(() => {
    if (!isOpen || !execution.pendingReceipt || !walletAddress || !data) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    const pollReceipt = async () => {
      if (!execution.pendingReceipt) {
        return;
      }

      try {
        const receipt = connectorClientRef.current
          ? await connectorClientRef.current.request({
              method: "eth_getTransactionReceipt",
              params: [execution.pendingReceipt.hash],
            })
          : await getPublicClient(wagmiConfig, {
              chainId: execution.pendingReceipt.chainId,
            })?.getTransactionReceipt({
              hash: execution.pendingReceipt.hash,
            });

        if (cancelled) {
          return;
        }

        if (!receipt) {
          timeoutId = window.setTimeout(() => {
            void pollReceipt();
          }, 2000);
          return;
        }

        if (receipt.status !== "0x1" && receipt.status !== "success") {
          setExecution((current) => ({
            ...current,
            error: `${execution.pendingReceipt?.step === "approval" ? "Approval" : "Route"} transaction failed onchain.`,
            isConfirmed: false,
            pendingReceipt: null,
            runningStep: null,
          }));
          return;
        }

        if (execution.pendingReceipt.step === "approval") {
          setExecution((current) => ({
            ...current,
            error: null,
            isConfirmed: false,
            pendingReceipt: null,
            runningStep: "route",
          }));

          await submitRoute({
            executionChainId: execution.pendingReceipt.chainId,
            quote: data,
            userAddress: walletAddress,
          });
          return;
        }

        setExecution((current) => ({
          ...current,
          error: null,
          isConfirmed: true,
          pendingReceipt: null,
          runningStep: null,
        }));
      } catch {
        if (cancelled) {
          return;
        }

        timeoutId = window.setTimeout(() => {
          void pollReceipt();
        }, 2000);
      }
    };

    timeoutId = window.setTimeout(() => {
      void pollReceipt();
    }, 1200);

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [data, execution.pendingReceipt, isOpen, submitRoute, walletAddress]);

  const aggregatePrincipalUsd = multiQuotes.reduce(
    (sum, item) => sum + (item.value?.principalUsd ?? 0),
    0,
  );
  const aggregateFeesUsd = multiQuotes.reduce(
    (sum, item) => sum + (item.value?.totalFeesUsd ?? 0),
    0,
  );
  const aggregateDailyYieldUsd = multiQuotes.reduce((sum, item) => {
    if (!item.value) {
      return sum;
    }

    return sum + item.value.principalUsd * (item.value.apyDecimal / 365);
  }, 0);
  const aggregateBreakEvenDays =
    aggregateDailyYieldUsd > 0 ? aggregateFeesUsd / aggregateDailyYieldUsd : 0;
  const aggregateApyPercent =
    aggregatePrincipalUsd > 0
      ? (multiQuotes.reduce((sum, item) => {
          if (!item.value) {
            return sum;
          }

          return sum + item.value.principalUsd * item.value.apyPercent;
        }, 0) / aggregatePrincipalUsd)
      : 0;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-6 md:px-8">
        <section
          aria-labelledby="quote-modal-title"
          aria-modal="true"
          className="panel-frame flex h-[calc(100vh-3rem)] w-full max-w-4xl flex-col overflow-hidden bg-[var(--color-panel)] shadow-[0_0_60px_rgba(164,255,185,0.08)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div className="technical-grid shrink-0 flex items-start justify-between border-b border-white/10 bg-white/[0.04] px-6 py-5 md:px-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent)]">
                Live Quote Console
              </p>
              <h2
                className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-[-0.05em] text-white"
                id="quote-modal-title"
              >
                {isMultiInput
                  ? `${validSelections.length} assets into ${vaultLabel}`
                  : `${primarySelection?.amount ?? "0"} ${primarySelection?.tokenSymbol ?? "TOKEN"} into ${vaultLabel}`}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {vaultSubtitle} · {isMultiInput
                  ? `${validSelections.length} source routes`
                  : formatChainLabel(primarySelection?.chainId)}{" "}
                → {formatChainLabel(targetChainId)}
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

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6 border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Source"
                  value={
                    isMultiInput
                      ? `${validSelections.length} tokens / multi-chain`
                      : `${primarySelection?.tokenSymbol ?? "-"} / ${formatChainLabel(primarySelection?.chainId)}`
                  }
                />
                <MetricCard
                  label="Input"
                  value={
                    isMultiInput
                      ? validSelections
                          .map((selection) => `${selection.amount} ${selection.tokenSymbol}`)
                          .join(" + ")
                      : primarySelection
                        ? `${primarySelection.amount} ${primarySelection.tokenSymbol}`
                        : "-"
                  }
                />
                <MetricCard
                  label="Vault"
                  value={vaultLabel}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Estimated Fees"
                  value={
                    isMultiInput
                      ? multiQuotes.length
                        ? formatUsd(aggregateFeesUsd)
                        : isMultiLoading
                          ? "Refreshing..."
                          : "-"
                      : data
                        ? formatUsd(data.totalFeesUsd)
                        : isLoading
                          ? "Refreshing..."
                          : "-"
                  }
                />
                <MetricCard
                  label="APY"
                  value={
                    isMultiInput
                      ? multiQuotes.length
                        ? `${aggregateApyPercent.toFixed(2)}%`
                        : isMultiLoading
                          ? "..."
                          : "-"
                      : data
                        ? `${data.apyPercent.toFixed(2)}%`
                        : isLoading
                          ? "..."
                          : "-"
                  }
                />
                <MetricCard
                  label="Break-Even"
                  value={
                    isMultiInput
                      ? multiQuotes.length
                        ? formatBreakEvenWindow(aggregateBreakEvenDays)
                        : isMultiLoading
                          ? "..."
                          : "-"
                      : data
                        ? formatBreakEvenWindow(data.breakEvenDays)
                        : isLoading
                          ? "..."
                          : "-"
                  }
                />
              </div>

              <div className="pixel-box bg-black/30 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Route Status
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                    {execution.routeHash
                      ? execution.isConfirmed
                        ? "Confirmed"
                        : "Submitted"
                      : isMultiInput && multiQuotes.length
                        ? "Aggregated"
                      : execution.runningStep
                        ? executionTitleByStep[execution.runningStep]
                        : data
                          ? "Quote Ready"
                          : isLoading
                            ? "Building"
                            : "Waiting"}
                  </span>
                </div>
                <div className="space-y-3">
                  {phaseStates.map((phase) => (
                    <div
                      key={phase.id}
                      className={`pixel-chip flex items-center gap-3 px-4 py-3 ${
                        phase.status === "active"
                          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/8"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      {phase.status === "done" ? (
                        <Check className="size-4 text-[var(--color-accent)]" />
                      ) : phase.status === "active" ? (
                        <CircleDashed className="size-4 animate-spin text-[var(--color-accent)]" />
                      ) : (
                        <div className="size-4 rounded-full border border-white/15" />
                      )}
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                        {phase.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error ? (
                <p className="border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {error}
                </p>
              ) : null}

              {isMultiInput && multiError ? (
                <p className="border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {multiError}
                </p>
              ) : null}

              {execution.error ? (
                <p className="border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {execution.error}
                </p>
              ) : null}

              {isMultiInput && multiQuotes.length ? (
                <div className="pixel-box space-y-3 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Aggregated Inputs
                  </p>
                  {multiQuotes.map((item) => (
                    <div
                      key={`${item.selection.chainId}:${item.selection.tokenAddress}`}
                      className="pixel-chip grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                          {item.selection.amount} {item.selection.tokenSymbol}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatChainLabel(item.selection.chainId)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[11px] text-white">
                          {item.value ? formatUsd(item.value.totalFeesUsd) : "-"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">Fees</p>
                      </div>
                      <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                        item.status === "ready" ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
                      }`}>
                        {item.status === "ready" ? "Ready" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

              <div className="space-y-6 p-6 md:p-8">
              <div className="pixel-box bg-white/5 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  Execution Target
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
                  {data?.selectedVault.name ?? vaultLabel}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  {data
                    ? `${data.selectedVault.protocol.name} selected from live Earn data.`
                    : "Waiting for the live Composer route to resolve the final transactional vault."}
                </p>
              </div>

              <div className="pixel-box bg-white/5 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                  Transaction Details
                </p>
                <div className="mt-4 space-y-3">
                  <InlineMetric
                    label="Quote Id"
                    value={
                      isMultiInput
                        ? `${multiQuotes.filter((item) => item.status === "ready").length}/${validSelections.length} ready`
                        : data?.quoteId ?? (isLoading ? "pending" : "-")
                    }
                  />
                  <InlineMetric
                    label="Approval"
                    value={
                      data
                        ? data.approvalAddress
                          ? "Required if allowance is low"
                          : "Not required"
                        : "-"
                    }
                  />
                  <InlineMetric
                    label="Destination"
                    value={data ? formatChainLabel(data.toChainId) : formatChainLabel(targetChainId)}
                  />
                </div>
              </div>

              {execution.approvalHash || execution.routeHash ? (
                <div className="space-y-3">
                  {execution.approvalHash ? (
                    <ExplorerLink
                      hash={execution.approvalHash}
                      href={buildExplorerUrl(
                        execution.approvalHash,
                        data?.fromChainId ?? primarySelection?.chainId ?? CHAINS.BASE,
                      )}
                      label="Approval Tx"
                    />
                  ) : null}
                  {execution.routeHash ? (
                    <ExplorerLink
                      hash={execution.routeHash}
                      href={buildExplorerUrl(
                        execution.routeHash,
                        data?.transactionRequest.chainId ?? data?.fromChainId ?? primarySelection?.chainId ?? CHAINS.BASE,
                      )}
                      label="Route Tx"
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="panel-frame bg-black/30 p-3 shadow-[0_0_32px_rgba(164,255,185,0.08)]">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Next Action
                </p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <button
                    className={`pixel-chip group flex min-h-14 w-full items-center justify-center gap-3 border px-6 py-4 font-[family-name:var(--font-display)] text-base font-black uppercase tracking-[0.08em] transition-all ${
                      data
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[#04160f] shadow-[0_10px_28px_rgba(164,255,185,0.32)] hover:-translate-y-0.5 hover:brightness-105"
                        : "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:-translate-y-0.5 hover:bg-[var(--color-accent)]/16"
                    } disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-zinc-500 disabled:shadow-none`}
                    disabled={
                      !validSelections.length ||
                      execution.runningStep !== null ||
                      (isMultiInput ? isMultiLoading : isLoading && !data)
                    }
                    onClick={() => void handleExecute()}
                    type="button"
                  >
                    <span>
                      {!walletAddress
                        ? "Connect Wallet"
                        : isMultiInput
                          ? "Preview Multi-Route"
                        : execution.isConfirmed
                          ? "View Holdings"
                          : execution.pendingReceipt?.step === "route"
                            ? "Route Submitted"
                            : execution.pendingReceipt?.step === "approval"
                              ? "Approval Submitted"
                              : execution.pendingReceipt
                                ? "Waiting For Confirmation..."
                          : data
                            ? "Execute Quote"
                            : isLoading
                              ? "Building Live Quote..."
                              : "Execute After Refresh"}
                    </span>
                    {!execution.isConfirmed ? (
                      <span className="flex size-6 items-center justify-center rounded-full border border-current/30 bg-black/10 transition group-hover:translate-x-0.5">
                        <ArrowRight className="size-3.5" />
                      </span>
                    ) : null}
                  </button>

                  <button
                    aria-label="Refresh quote"
                    className="pixel-chip group flex min-h-14 w-14 items-center justify-center border border-white/15 text-zinc-200 transition-all hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-zinc-500"
                    disabled={!validSelections.length || (isMultiInput ? isMultiLoading : isLoading) || execution.runningStep !== null}
                    onClick={() => void handleRefreshQuote()}
                    type="button"
                  >
                    <RefreshCcw className="size-4 transition-transform group-hover:rotate-45" />
                    <span className="sr-only">Refresh Quote</span>
                  </button>
                </div>
              </div>

              <p className="text-center text-sm text-zinc-500">
                {!walletAddress
                  ? "Connect your wallet to request and execute the live quote."
                  : isMultiInput
                    ? "Multi-input quote preview is active. Each selected token gets its own LI.FI route and the totals are aggregated here."
                  : execution.pendingReceipt?.step === "route"
                    ? "Route submitted onchain. Waiting for confirmation inside this modal."
                    : execution.pendingReceipt?.step === "approval"
                      ? "Approval submitted onchain. Waiting for confirmation inside this modal."
                  : data
                    ? "The route is ready. Approval and swap will stay inside this modal."
                    : isLoading
                      ? "Building a live Composer quote for the selected token and vault."
                      : "No live quote yet. Press Refresh Quote to retry immediately."}
              </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <HoldingsModal
        approvalHash={execution.approvalHash}
        isOpen={isHoldingsOpen}
        onClose={() => setIsHoldingsOpen(false)}
        recentRouteResult={
          primarySelection && execution.routeHash && !isMultiInput
            ? {
                destinationAddress: data?.toAddress ?? walletAddress ?? null,
                destinationChainId: data?.toChainId ?? targetChainId,
                expectedOutputAmount: undefined,
                expectedOutputSymbol:
                  composerTargetName ??
                  data?.selectedVault.name ??
                  targetAsset,
                inputAmount: primarySelection.amount,
                inputSymbol: primarySelection.tokenSymbol,
                protocolLabel: data?.selectedVault.protocol.name ?? targetProtocol,
                quoteId: data?.quoteId ?? null,
                vaultLabel: data?.selectedVault.name ?? vaultLabel,
              }
            : null
        }
        routeHash={execution.routeHash}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="pixel-box bg-white/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-lg text-white">{value}</p>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-[11px] text-white">{value}</span>
    </div>
  );
}

function ExplorerLink({
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
      className="pixel-box block bg-white/5 p-4 transition hover:border-[var(--color-accent)]/40"
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

const executionTitleByStep: Record<ExecutionStep, string> = {
  approval: "Approval",
  done: "Confirmed",
  quote: "Quote Locked",
  route: "Submitting Route",
  wallet: "Wallet Check",
};

function formatChainLabel(chainId?: number) {
  if (!chainId) {
    return "Unknown Chain";
  }

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

  return `${explorerByChainId[chainId] ?? "https://basescan.org/tx/"}${hash}`;
}

function formatExecutionError(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const shortMessage =
      "shortMessage" in error && typeof error.shortMessage === "string"
        ? error.shortMessage
        : null;
    const message =
      "message" in error && typeof error.message === "string" ? error.message : null;

    return shortMessage ?? message ?? "Transaction failed before confirmation.";
  }

  return "Transaction failed before confirmation.";
}

function toOptionalBigInt(value?: string) {
  if (!value) {
    return undefined;
  }

  return BigInt(value);
}
