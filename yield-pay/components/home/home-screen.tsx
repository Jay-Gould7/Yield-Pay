"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { erc20Abi, type Address, type Hash } from "viem";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDashed,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";

import { useYieldPay } from "@/hooks/useYieldPay";
import { TerminalButton } from "@/components/shared/terminal-button";
import {
  calculateBreakEvenEstimate,
  formatBreakEvenWindow,
  formatCompactUsd,
  formatHoursUntilProfit,
  formatUsd,
} from "@/lib/calculations";
import { CHAINS } from "@/lib/constants";
import {
  executionPhases,
  homeVaults,
  sourceChains,
  sourceTokens,
  type SourceTokenId,
} from "@/lib/home-data";
import { useWalletUi } from "@/lib/wallet/ui-context";

type HomeScreenProps = {
  initialCompareOpen?: boolean;
  initialExecutionOpen?: boolean;
  initialVaultId?: string;
};

type CompareItem = {
  dailyYieldUsd: number;
  estimatedCostUsd: number;
  id: string;
  isLive: boolean;
  label: string;
  note: string;
  protocol: string;
  value: string;
  vaultAddress?: Address;
};

type ExecutionPhaseId = (typeof executionPhases)[number]["id"];
type ExecutionNotes = Partial<Record<ExecutionPhaseId, string>>;

export function HomeScreen({
  initialCompareOpen = false,
  initialExecutionOpen = false,
  initialVaultId,
}: HomeScreenProps) {
  const { evmAddress, connectEvm, open } = useWalletUi();
  const { address: accountAddress, chainId } = useAccount();
  const basePublicClient = usePublicClient({ chainId: base.id });
  const { refresh, reset, data: liveQuote, error: liveError, isLoading: isQuoteLoading } =
    useYieldPay();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const [tokenId, setTokenId] = useState<SourceTokenId>("usdc");
  const [amountInput, setAmountInput] = useState("0.02");
  const [selectedProtocol, setSelectedProtocol] = useState(
    homeVaults.find((vault) => vault.id === initialVaultId)?.protocol ??
      homeVaults[0]?.protocol ??
      "Aave",
  );
  const [selectedVaultAddress, setSelectedVaultAddress] = useState<Address | null>(
    null,
  );
  const [isCompareOpen, setIsCompareOpen] = useState(initialCompareOpen);
  const [executionStep, setExecutionStep] = useState<number | null>(
    initialExecutionOpen ? 0 : null,
  );
  const [executionNotes, setExecutionNotes] = useState<ExecutionNotes>({});
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<Hash | null>(null);
  const [routeHash, setRouteHash] = useState<Hash | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const chain = sourceChains[0];
  const token = sourceTokens.find((item) => item.id === tokenId) ?? sourceTokens[0];
  const parsedAmount = Number(amountInput.replace(/,/g, ""));
  const amountValue = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const normalizedAmount = amountValue > 0 ? amountInput.trim() : "";
  const walletAddress = (accountAddress ?? evmAddress ?? undefined) as Address | undefined;
  const sourceTokenSymbol = tokenId === "eth" ? "ETH" : "USDC";

  const fallbackVaultOutcomes = useMemo(
    () =>
      homeVaults
        .map((vault) => ({
          vault,
          estimate: calculateBreakEvenEstimate({
            amountUsd: amountValue,
            apy: vault.apy,
            baseCost: vault.baseCost,
            chainMultiplier: chain.costMultiplier,
            tokenMultiplier: token.costMultiplier,
          }),
        }))
        .sort((left, right) => left.estimate.breakEvenDays - right.estimate.breakEvenDays),
    [amountValue, chain.costMultiplier, token.costMultiplier],
  );

  const fallbackRecommendation = fallbackVaultOutcomes[0];
  const selectedFallbackOutcome =
    fallbackVaultOutcomes.find((item) => item.vault.protocol === selectedProtocol) ??
    fallbackRecommendation;

  const liveCompareItems = useMemo(() => {
    if (!liveQuote) {
      return null;
    }

    return [...liveQuote.availableVaults]
      .map((vault) => {
        const dailyYieldUsd = liveQuote.principalUsd * (vault.analytics.apy.total / 365);
        const breakEvenDays =
          dailyYieldUsd > 0
            ? liveQuote.totalFeesUsd / dailyYieldUsd
            : Number.POSITIVE_INFINITY;

        return {
          dailyYieldUsd,
          estimatedCostUsd: liveQuote.totalFeesUsd,
          id: vault.address,
          isLive: true,
          label: vault.name,
          note: "Live Earn API vault on Base using the current quote fee snapshot.",
          protocol: vault.protocol.name,
          value: formatBreakEvenWindow(breakEvenDays),
          vaultAddress: vault.address,
        } satisfies CompareItem;
      })
      .sort((left, right) => {
        const leftDays = parseBreakEvenLabel(left.value);
        const rightDays = parseBreakEvenLabel(right.value);

        return leftDays - rightDays;
      });
  }, [liveQuote]);

  const fallbackCompareItems = useMemo<CompareItem[]>(
    () =>
      fallbackVaultOutcomes.map((item) => ({
        dailyYieldUsd: item.estimate.dailyYieldUsd,
        estimatedCostUsd: item.estimate.estimatedCostUsd,
        id: item.vault.id,
        isLive: false,
        label: item.vault.name,
        note: item.vault.reason,
        protocol: item.vault.protocol,
        value: formatBreakEvenWindow(item.estimate.breakEvenDays),
      })),
    [fallbackVaultOutcomes],
  );

  const compareItems: CompareItem[] = liveCompareItems ?? fallbackCompareItems;
  const activeProtocol =
    selectedProtocol || selectedFallbackOutcome?.vault.protocol || homeVaults[0]?.protocol;
  const activeVaultName = liveQuote?.selectedVault.name ?? selectedFallbackOutcome?.vault.name;
  const activeProtocolName =
    liveQuote?.selectedVault.protocol.name ?? selectedFallbackOutcome?.vault.protocol;
  const activeNetwork =
    liveQuote ? `Chain ${liveQuote.selectedVault.chainId}` : selectedFallbackOutcome?.vault.network;
  const activeApyPercent =
    liveQuote?.apyPercent ?? selectedFallbackOutcome?.vault.apy ?? 0;
  const activeCostUsd =
    liveQuote?.totalFeesUsd ?? selectedFallbackOutcome?.estimate.estimatedCostUsd ?? 0;
  const activeBreakEvenDays =
    liveQuote?.breakEvenDays ?? selectedFallbackOutcome?.estimate.breakEvenDays ?? 0;
  const activeDailyYieldUsd =
    liveQuote?.principalUsd && liveQuote?.apyDecimal
      ? liveQuote.principalUsd * (liveQuote.apyDecimal / 365)
      : selectedFallbackOutcome?.estimate.dailyYieldUsd ?? 0;
  const activePrincipalUsd =
    liveQuote?.principalUsd ?? amountValue;
  const activeReason = liveQuote
    ? `${liveQuote.selectedVault.protocol.name} was selected from the live Base vault surface and matched with a current LI.FI route quote.`
    : selectedFallbackOutcome?.vault.reason ?? "";
  const recoveryProgress24h =
    activeCostUsd > 0 ? Math.min(100, (activeDailyYieldUsd / activeCostUsd) * 100) : 0;
  const hasExecutableQuote = Boolean(liveQuote?.transactionRequest);
  const executionPhasesWithNotes = useMemo(
    () =>
      executionPhases.map((phase) => ({
        ...phase,
        detail: executionNotes[phase.id] ?? phase.detail,
      })),
    [executionNotes],
  );
  const hasExecutionState =
    executionStep !== null ||
    isExecuting ||
    executionError !== null ||
    approvalHash !== null ||
    routeHash !== null ||
    Object.keys(executionNotes).length > 0;
  const isExecutionRunning = isExecuting;
  const isExecutionComplete =
    executionStep === executionPhasesWithNotes.length - 1 && !isExecuting && !executionError;
  const ctaLabel = !evmAddress
    ? "Connect Wallet To Start"
    : !hasExecutableQuote && isQuoteLoading
      ? "Refreshing Live Quote"
      : !hasExecutableQuote
        ? "Waiting For Live Quote"
        : isExecutionRunning && executionStep !== null
          ? executionPhasesWithNotes[executionStep].title
          : isExecutionComplete
            ? "Yield Position Active"
            : executionError
              ? "Retry Route"
              : "Start Earning";

  const resetExecutionState = () => {
    setApprovalHash(null);
    setExecutionError(null);
    setExecutionNotes({});
    setExecutionStep(null);
    setIsExecuting(false);
    setRouteHash(null);
  };

  const setExecutionNote = (phaseId: ExecutionPhaseId, detail: string) => {
    setExecutionNotes((current) => ({
      ...current,
      [phaseId]: detail,
    }));
  };

  const requestLiveQuote = useEffectEvent(async () => {
    if (!walletAddress || !normalizedAmount || !activeProtocol) {
      return;
    }

    await refresh({
      amount: normalizedAmount,
      fromChainId: CHAINS.BASE,
      fromTokenSymbol: sourceTokenSymbol,
      targetAsset: "USDC",
      targetProtocol: activeProtocol,
      targetVaultAddress: selectedVaultAddress ?? undefined,
      toChainId: CHAINS.BASE,
    });
  });

  useEffect(() => {
    if (!walletAddress || !normalizedAmount || !activeProtocol) {
      return;
    }

    const timer = window.setTimeout(() => {
      void requestLiveQuote();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeProtocol, normalizedAmount, selectedVaultAddress, tokenId, walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      return;
    }

    if (!liveQuote && !liveError && !isQuoteLoading && !hasExecutionState) {
      return;
    }

    if (liveQuote || liveError || isQuoteLoading) {
      reset();
    }

    if (approvalHash) {
      setApprovalHash(null);
    }

    if (executionError) {
      setExecutionError(null);
    }

    if (Object.keys(executionNotes).length > 0) {
      setExecutionNotes({});
    }

    if (executionStep !== null) {
      setExecutionStep(null);
    }

    if (isExecuting) {
      setIsExecuting(false);
    }

    if (routeHash) {
      setRouteHash(null);
    }
  }, [
    approvalHash,
    executionError,
    executionNotes,
    executionStep,
    hasExecutionState,
    isExecuting,
    isQuoteLoading,
    liveError,
    liveQuote,
    reset,
    routeHash,
    walletAddress,
  ]);

  const handleAmountChange = (value: string) => {
    reset();
    resetExecutionState();
    setAmountInput(value);
  };

  const handleTokenChange = (value: string) => {
    reset();
    resetExecutionState();
    setTokenId(value as SourceTokenId);
  };

  const handleCompareSelection = (item: CompareItem) => {
    reset();
    resetExecutionState();
    setSelectedProtocol(item.protocol);
    setSelectedVaultAddress(item.vaultAddress ?? null);
    setIsCompareOpen(false);
  };

  const handlePrimaryAction = async () => {
    if (!walletAddress) {
      connectEvm();
      open();
      return;
    }

    if (isExecutionRunning || amountValue <= 0) {
      return;
    }

    let executableQuote = liveQuote;

    if (!hasExecutableQuote) {
      const result = await refresh({
        amount: normalizedAmount || "0.02",
        fromChainId: CHAINS.BASE,
        fromTokenSymbol: sourceTokenSymbol,
        targetAsset: "USDC",
        targetProtocol: activeProtocol,
        targetVaultAddress: selectedVaultAddress ?? undefined,
        toChainId: CHAINS.BASE,
      });

      if (!result) {
        return;
      }

      executableQuote = result;
    }

    if (!executableQuote) {
      return;
    }

    resetExecutionState();
    setExecutionStep(0);
    setIsExecuting(true);
    setExecutionNote(
      "wallet",
      chainId === base.id
        ? "Wallet connected on Base. Preparing the LI.FI execution payload."
        : "Switching the connected wallet to Base so the route can execute.",
    );

    try {
      const executionChainId =
        executableQuote.transactionRequest.chainId ?? executableQuote.fromChainId;

      if (chainId !== executionChainId) {
        await switchChainAsync({ chainId: executionChainId });
        setExecutionNote(
          "wallet",
          `Wallet switched to ${formatChainLabel(executionChainId)}. Execution can continue.`,
        );
      } else {
        setExecutionNote(
          "wallet",
          `Wallet already on ${formatChainLabel(executionChainId)}. Execution can continue immediately.`,
        );
      }

      setExecutionStep(1);
      setExecutionNote(
        "quote",
        `Quote ${executableQuote.quoteId ?? "snapshot"} locked with ${formatUsd(
          executableQuote.totalFeesUsd,
        )} in projected route costs.`,
      );

      setExecutionStep(2);

      if (executableQuote.fromToken.isNative || !executableQuote.approvalAddress) {
        setExecutionNote(
          "approval",
          executableQuote.fromToken.isNative
            ? "Native ETH route detected. No ERC-20 approval is required."
            : "The route can spend this token without a separate approval transaction.",
        );
      } else {
        if (!basePublicClient) {
          throw new Error("Base public client is unavailable.");
        }

        const requiredAmount = BigInt(executableQuote.amountAtomic);
        setExecutionNote(
          "approval",
          `Checking ${executableQuote.fromToken.symbol} allowance on Base before execution.`,
        );

        const allowance = await basePublicClient.readContract({
          abi: erc20Abi,
          address: executableQuote.fromToken.address,
          args: [walletAddress, executableQuote.approvalAddress],
          functionName: "allowance",
        });

        if (allowance < requiredAmount) {
          setExecutionNote(
            "approval",
            `Approval required. Confirm ${executableQuote.fromToken.symbol} spending in your wallet.`,
          );

          const nextApprovalHash = await writeContractAsync({
            abi: erc20Abi,
            account: walletAddress,
            address: executableQuote.fromToken.address,
            args: [executableQuote.approvalAddress, requiredAmount],
            chainId: executableQuote.fromChainId,
            functionName: "approve",
          });

          setApprovalHash(nextApprovalHash);
          setExecutionNote(
            "approval",
            `Approval submitted: ${formatHashLabel(
              nextApprovalHash,
            )}. Waiting for Base confirmation.`,
          );

          await basePublicClient.waitForTransactionReceipt({
            hash: nextApprovalHash,
          });

          setExecutionNote(
            "approval",
            `Approval confirmed on Base. ${executableQuote.fromToken.symbol} is now spendable for this route.`,
          );
        } else {
          setExecutionNote(
            "approval",
            `Existing ${executableQuote.fromToken.symbol} allowance already covers this amount.`,
          );
        }
      }

      setExecutionStep(3);
      setExecutionNote(
        "route",
        "Waiting for your wallet signature to submit the LI.FI transaction request.",
      );

      const nextRouteHash = await sendTransactionAsync({
        account: walletAddress,
        chainId: executionChainId,
        data: executableQuote.transactionRequest.data,
        gas: toOptionalBigInt(executableQuote.transactionRequest.gasLimit),
        gasPrice: toOptionalBigInt(executableQuote.transactionRequest.gasPrice),
        to: executableQuote.transactionRequest.to,
        value: toOptionalBigInt(executableQuote.transactionRequest.value),
      });

      setRouteHash(nextRouteHash);
      setExecutionNote(
        "route",
        `Route submitted: ${formatHashLabel(nextRouteHash)}. Waiting for Base confirmation.`,
      );

      if (!basePublicClient) {
        throw new Error("Base public client is unavailable.");
      }

      await basePublicClient.waitForTransactionReceipt({
        hash: nextRouteHash,
      });

      setExecutionStep(4);
      setExecutionNote(
        "done",
        `Route confirmed. ${executableQuote.selectedVault.name} is now active on Base and earning toward full fee recovery.`,
      );
    } catch (error) {
      setExecutionError(formatExecutionError(error));
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-8">
        <section className="panel-frame overflow-hidden bg-[var(--color-panel)]">
          <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="relative overflow-hidden p-6 md:p-8 xl:p-10">
              <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
              <div className="relative">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-accent)]">
                  Base_Faucet_Flow
                </p>
                <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.08em] text-white sm:text-5xl xl:text-6xl">
                  This move pays for itself in{" "}
                  <span className="text-[var(--color-accent)]">
                    {formatBreakEvenWindow(activeBreakEvenDays)}
                  </span>
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-400">
                  Live quote mode is now active on Base: we fetch depositable vaults
                  from LI.FI Earn, lock a route quote, then estimate exactly how long
                  vault yield should take to cover today&apos;s cost.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <HeroStat label="Projected Cost" value={formatUsd(activeCostUsd)} />
                  <HeroStat
                    label="Daily Yield"
                    value={`${formatUsd(activeDailyYieldUsd)}/day`}
                  />
                  <HeroStat
                    label="Net-Positive"
                    value={formatHoursUntilProfit(activeBreakEvenDays)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/8 bg-[var(--color-bg-elevated)] p-6 md:p-8 xl:border-l xl:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Live Recommendation
              </p>
              <div className="mt-5 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                      {activeVaultName}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      {activeProtocolName} / {activeNetwork}
                    </p>
                  </div>
                  <span className="border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    {liveQuote ? "Live quote" : "Fallback model"}
                  </span>
                </div>

                <div className="grid gap-3">
                  <InfoCard
                    title="APY"
                    value={`${activeApyPercent.toFixed(2)}%`}
                    note={
                      liveQuote
                        ? `Quote ${liveQuote.quoteId ?? "pending"} / approval ${
                            liveQuote.approvalAddress ? "may be required" : "not required"
                          }`
                        : "Static preview until a wallet is connected"
                    }
                  />
                  <InfoCard
                    title="Why this wins"
                    value={activeReason}
                    note={
                      liveQuote
                        ? "Live Earn vault selected from Base and matched to the current quote."
                        : chain.routeNote
                    }
                  />
                </div>

                <TerminalButton
                  className="w-full justify-between py-4"
                  variant="secondary"
                  onClick={() => setIsCompareOpen(true)}
                >
                  Compare vaults
                  <ChevronRight className="size-4" />
                </TerminalButton>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-8">
            <section className="panel-frame bg-[var(--color-bg-elevated)] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <Sparkles className="size-4 text-[var(--color-accent)]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  One Input Pass
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <InputBlock label="From Chain">
                  <select
                    value={chain.id}
                    disabled
                    className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
                  >
                    <option value={chain.id} className="bg-[#111111]">
                      {chain.label}
                    </option>
                  </select>
                </InputBlock>

                <InputBlock label="Token">
                  <select
                    value={tokenId}
                    onChange={(event) => handleTokenChange(event.target.value)}
                    className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-[var(--color-accent)]"
                  >
                    {sourceTokens.map((option) => (
                      <option key={option.id} value={option.id} className="bg-[#111111]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </InputBlock>

                <InputBlock label="Amount">
                  <input
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => handleAmountChange(event.target.value)}
                    placeholder="0.02"
                    className="w-full border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--color-accent)]"
                  />
                </InputBlock>
              </div>

              <div className="mt-5 text-sm leading-7 text-zinc-500">
                Base faucet mode is enabled here, so source token addresses and the
                default quote flow both stay on Base mainnet.
              </div>
            </section>

            <section className="panel-frame bg-[var(--color-panel)] p-6 md:p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-[var(--color-accent)]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Cost Recovery Preview
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <MetricRow label="Estimated route cost" value={formatUsd(activeCostUsd)} />
                <MetricRow
                  label="Projected yearly yield"
                  value={formatCompactUsd(activePrincipalUsd * (activeApyPercent / 100))}
                />
                <MetricRow
                  label="Break-even window"
                  value={formatBreakEvenWindow(activeBreakEvenDays)}
                />
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  <span>First-day cost recovery</span>
                  <span className="text-[var(--color-accent)]">
                    {Math.round(recoveryProgress24h)}%
                  </span>
                </div>
                <div className="h-2 bg-white/8">
                  <div
                    className="h-full bg-[var(--color-accent)] shadow-[var(--shadow-accent)]"
                    style={{ width: `${recoveryProgress24h}%` }}
                  />
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {liveQuote
                    ? "The live quote is now anchored to the selected Base vault and current wallet address."
                    : selectedFallbackOutcome?.vault.routePlan}
                </p>
                {liveError ? (
                  <p className="mt-4 border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                    {liveError}
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="panel-frame bg-[var(--color-panel)] p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                    Recommended move
                  </p>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                    {token.label} on Base into {activeVaultName}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                    {liveQuote
                      ? "Live APY and route fees are now coming from LI.FI instead of the local mock model."
                      : "Connect your wallet to replace the fallback model with a live Base quote and live Earn vault selection."}
                  </p>
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {liveQuote ? "Live Base route" : "Preview mode"}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <SummaryPanel
                  label="Principal"
                  value={formatUsd(activePrincipalUsd)}
                  note="USD notional used for break-even math"
                />
                <SummaryPanel
                  label="APY"
                  value={`${activeApyPercent.toFixed(2)}%`}
                  note={`${activeProtocolName} / Base yield source`}
                />
                <SummaryPanel
                  label="Transaction"
                  value={
                    isExecutionComplete
                      ? "Confirmed"
                      : isExecutionRunning
                        ? "Broadcasting"
                        : hasExecutableQuote
                          ? "Ready"
                          : "Pending"
                  }
                  note={
                    routeHash
                      ? `Hash ${formatHashLabel(routeHash)}`
                      : liveQuote?.transactionRequest
                        ? `To ${liveQuote.transactionRequest.to.slice(0, 8)}...`
                        : "Awaiting live route assembly"
                  }
                />
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <TerminalButton
                  className="w-full justify-center gap-3 py-4 text-[12px]"
                  disabled={
                    amountValue <= 0 ||
                    isExecutionRunning ||
                    (Boolean(evmAddress) && !hasExecutableQuote && isQuoteLoading)
                  }
                  onClick={() => void handlePrimaryAction()}
                >
                  {ctaLabel}
                  {!isExecutionRunning && !isExecutionComplete ? (
                    <ArrowRight className="size-4" />
                  ) : null}
                </TerminalButton>
                <p className="text-center text-sm text-zinc-500">
                  {evmAddress
                    ? hasExecutableQuote
                      ? "Live quote locked. One action, one route, one recovery window."
                      : "Connected. Waiting for the live Base quote to finish."
                    : "Wallet connection is the only step before live quote generation."}
                </p>
              </div>
            </section>

            {(executionStep !== null || initialExecutionOpen) && (
              <section className="panel-frame bg-[var(--color-bg-elevated)] p-6 md:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Execution Status
                </p>
                <div className="mt-6 space-y-4">
                  {executionPhasesWithNotes.map((phase, index) => {
                    const isDone = executionStep !== null && index < executionStep;
                    const isActive = executionStep === index;

                    return (
                      <div
                        key={phase.id}
                        className={`flex items-start gap-4 border border-white/8 px-4 py-4 transition ${
                          isActive ? "bg-white/5" : "bg-transparent"
                        }`}
                      >
                        <div className="mt-0.5">
                          {isDone ? (
                            <Check className="size-4 text-[var(--color-accent)]" />
                          ) : isActive ? (
                            <CircleDashed className="size-4 animate-spin text-[var(--color-accent)]" />
                          ) : (
                            <div className="size-4 rounded-full border border-white/10" />
                          )}
                        </div>

                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white">
                            {phase.title}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-zinc-400">
                            {phase.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isExecutionComplete ? (
                  <div className="mt-6 border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/8 px-4 py-4 text-sm text-[var(--color-text)]">
                    Route complete. The position is now active, and projected vault
                    yield is working toward full cost recovery.
                  </div>
                ) : null}

                {executionError ? (
                  <div className="mt-6 border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-4 text-sm text-[var(--color-danger)]">
                    {executionError}
                  </div>
                ) : null}

                {approvalHash || routeHash ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {approvalHash ? (
                      <TxCard
                        href={buildExplorerUrl(approvalHash)}
                        label="Approval Tx"
                        value={formatHashLabel(approvalHash)}
                      />
                    ) : null}
                    {routeHash ? (
                      <TxCard
                        href={buildExplorerUrl(routeHash)}
                        label="Route Tx"
                        value={formatHashLabel(routeHash)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </section>
            )}
          </div>
        </section>
      </div>

      {isCompareOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
          onClick={() => setIsCompareOpen(false)}
        >
          <div className="mx-auto flex min-h-screen max-w-[1400px] items-center px-4 py-8 lg:px-8">
            <div
              className="panel-frame ml-auto w-full max-w-[640px] bg-[#151515] p-6 md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Compare Vaults
                  </p>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                    Pick the recovery window you want
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompareOpen(false)}
                  className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 transition hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 space-y-3">
                {compareItems.map((item) => {
                  const isSelected = item.vaultAddress
                    ? selectedVaultAddress === item.vaultAddress ||
                      liveQuote?.selectedVault.address === item.vaultAddress
                    : selectedProtocol === item.protocol;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCompareSelection(item)}
                      className={`w-full border p-5 text-left transition ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/6"
                          : "border-white/10 bg-white/0 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
                            {item.label}
                          </p>
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            {item.protocol} / Base
                          </p>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                          {item.value}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <CompareMetric label="Cost" value={formatUsd(item.estimatedCostUsd)} />
                        <CompareMetric
                          label="Daily Yield"
                          value={`${formatUsd(item.dailyYieldUsd)}/day`}
                        />
                        <CompareMetric
                          label="Source"
                          value={item.isLive ? "Live" : "Model"}
                        />
                      </div>

                      <p className="mt-5 text-sm leading-7 text-zinc-400">{item.note}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-white/3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}

function InputBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-base text-white">{value}</span>
    </div>
  );
}

function SummaryPanel({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-white/8 bg-white/3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-6 text-zinc-500">{note}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="border border-white/8 bg-white/4 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-white">{value}</p>
      <p className="mt-2 text-xs leading-6 text-zinc-500">{note}</p>
    </div>
  );
}

function CompareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-xl tracking-[-0.04em] text-white">
        {value}
      </p>
    </div>
  );
}

function parseBreakEvenLabel(value: string) {
  const number = Number.parseFloat(value);

  if (!Number.isFinite(number)) {
    return Number.POSITIVE_INFINITY;
  }

  return value.includes("hours") ? number / 24 : number;
}

function TxCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border border-white/8 bg-white/3 p-4 transition hover:border-[var(--color-accent)]/40 hover:bg-white/5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-sm text-white">{value}</p>
    </a>
  );
}

function buildExplorerUrl(hash: Hash) {
  return `https://basescan.org/tx/${hash}`;
}

function formatChainLabel(chainId: number) {
  return chainId === base.id ? "Base (8453)" : `Chain ${chainId}`;
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

function formatHashLabel(hash: Hash) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function toOptionalBigInt(value?: string) {
  if (!value) {
    return undefined;
  }

  return BigInt(value);
}
