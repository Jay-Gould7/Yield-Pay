"use client";

import { ParallaxPxlKitIcon } from "@pxlkit/core";
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
import { RetroTV } from "@/components/icons/retro-tv";
import Shuffle from "@/components/rb/Shuffle";
import { TerminalButton } from "@/components/shared/terminal-button";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import {
  calculateBreakEvenEstimate,
  formatBreakEvenWindow,
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
  const { evmAddress, connectEvm } = useWalletUi();
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
  const routeStateLabel = isExecutionComplete
    ? "Confirmed"
    : isExecutionRunning
      ? "Broadcasting"
      : hasExecutableQuote
        ? "Ready"
        : isQuoteLoading
          ? "Building"
          : "Pending";
  const isVaultMatrixHighlighted = initialCompareOpen || Boolean(selectedVaultAddress);

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

  const readRouteAllowance = async (owner: Address, spender: Address, tokenAddress: Address) => {
    if (!basePublicClient) {
      throw new Error("Base public client is unavailable.");
    }

    return basePublicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      args: [owner, spender],
      functionName: "allowance",
    });
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
  };

  const handlePrimaryAction = async () => {
    if (!walletAddress) {
      connectEvm();
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
      const requiredAmount = BigInt(executableQuote.amountAtomic);
      const approvalRequiredByRoute =
        !executableQuote.fromToken.isNative && Boolean(executableQuote.approvalAddress);
      let allowanceSatisfied = executableQuote.fromToken.isNative || !executableQuote.approvalAddress;

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

      if (approvalRequiredByRoute && executableQuote.approvalAddress) {
        setExecutionNote(
          "approval",
          `Checking ${executableQuote.fromToken.symbol} allowance on Base before execution.`,
        );

        const allowance = await readRouteAllowance(
          walletAddress,
          executableQuote.approvalAddress,
          executableQuote.fromToken.address,
        );

        allowanceSatisfied = allowance >= requiredAmount;
      }

      if (executableQuote.fromToken.isNative || !executableQuote.approvalAddress) {
        setExecutionNote(
          "approval",
          executableQuote.fromToken.isNative
            ? "Native ETH route detected. No ERC-20 approval is required."
            : "The route can spend this token without a separate approval transaction.",
        );
      } else if (!allowanceSatisfied) {
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

        if (!basePublicClient) {
          throw new Error("Base public client is unavailable.");
        }

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
    <div className="px-4 py-5 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-[1400px] space-y-4">
        <section className="relative overflow-hidden py-0">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h1 className="pixel-hero-heading max-w-5xl">
              <span className="pixel-hero-copy">
                <span className="pixel-hero-line">This move pays</span>
                <span className="pixel-hero-line">for itself in</span>
              </span>
              <Shuffle
                text={formatBreakEvenWindow(activeBreakEvenDays)}
                tag="span"
                className="pixel-hero-shuffle"
                shuffleDirection="up"
                duration={0.35}
                animationMode="evenodd"
                shuffleTimes={1}
                ease="power3.out"
                stagger={0.03}
                threshold={0.1}
                triggerOnce={true}
                triggerOnHover={true}
                respectReducedMotion={true}
                loop={false}
                loopDelay={0}
                textAlign="left"
              />
            </h1>
            <div className="flex w-full items-end justify-end gap-2 md:w-auto md:self-end">
              <span
                aria-hidden="true"
                className="pointer-events-none flex shrink-0 items-center justify-center"
              >
                <ParallaxPxlKitIcon
                  icon={RetroTV}
                  size={45}
                  colorful
                  interactive={false}
                  shadow={false}
                />
              </span>
              <ConnectWalletButton className="pixel-chip w-full justify-between px-2 py-1.5 text-[6px] tracking-[0.1em] shadow-[var(--shadow-accent)] md:w-auto md:min-w-[9.9rem]" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-[4fr_6fr]">
          <section className="panel-frame bg-[var(--color-bg-elevated)] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="size-4 text-[var(--color-accent)]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Single-Screen Command
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className=" font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
                  USDC into USDC
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  {activeVaultName ?? "Awaiting vault"} on {activeProtocolName} /{" "}
                  {activeNetwork}
                </p>
              </div>
              <span className="pixel-chip bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {routeStateLabel}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <InputBlock label="From Chain">
                  <select
                    value={chain.id}
                    disabled
                    className="pixel-box w-full bg-white/5 px-4 py-4 text-sm text-white outline-none"
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
                    className="pixel-box w-full bg-white/5 px-4 py-4 text-sm text-white outline-none transition focus:border-[var(--color-accent)]"
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
                    className="pixel-box w-full bg-white/5 px-4 py-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--color-accent)]"
                  />
                </InputBlock>
              </div>

              <div className="space-y-4">
                <CommandMetric
                  label="Principal"
                  value={formatUsd(activePrincipalUsd)}
                />
                <CommandMetric
                  label="Break-even"
                  value={formatBreakEvenWindow(activeBreakEvenDays)}
                />
                <CommandMetric
                  label="Live APY"
                  value={`${activeApyPercent.toFixed(2)}%`}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
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
                    ? "All critical numbers are already on screen. The next click only drives wallet confirmations."
                    : "Connected. Waiting for the live Base quote to finish."
                  : "Wallet connection is the only step before live quote generation."}
              </p>
            </div>
          </section>

          <section
            className={`panel-frame bg-[var(--color-panel)] p-6 md:p-8 ${
              isVaultMatrixHighlighted ? "shadow-[var(--shadow-accent)]" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Vault Matrix
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
                  Compare every recovery window on the page
                </h2>
              </div>
            </div>

            <div className="pixel-box mt-6 overflow-hidden bg-white/[0.02]">
              <div className="hidden grid-cols-[1.7fr_0.95fr_1fr_0.8fr] gap-4 border-b border-white/8 bg-white/4 px-5 py-3 md:grid">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Name
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Break-even
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Daily Yield
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Source
                </p>
              </div>

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
                    className={`w-full border-b border-white/8 px-5 py-4 text-left transition last:border-b-0 ${
                      isSelected
                        ? "bg-[var(--color-accent)]/6"
                        : "border-white/10 bg-white/0 hover:bg-white/5"
                    }`}
                  >
                    <div className="grid gap-3 md:grid-cols-[1.7fr_0.95fr_1fr_0.8fr] md:items-center">
                      <CompareRowItem
                        label="Name"
                        value={item.label}
                        className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white"
                      />
                      <CompareRowItem
                        label="Break-even"
                        value={item.value}
                      />
                      <CompareRowItem
                        label="Daily Yield"
                        value={`${formatUsd(item.dailyYieldUsd)}/day`}
                      />
                      <CompareRowItem
                        label="Source"
                        value={item.isLive ? "LIVE" : "MODEL"}
                        className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <span>First-day cost recovery</span>
                <span className="text-[var(--color-accent)]">
                  {Math.round(recoveryProgress24h)}%
                </span>
              </div>
              <div className="pixel-box h-4 overflow-hidden bg-white/8 p-0">
                <div
                  className="h-full bg-[var(--color-accent)] shadow-[var(--shadow-accent)]"
                  style={{ width: `${recoveryProgress24h}%` }}
                />
              </div>
              {liveError ? (
                <p className="mt-4 border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {liveError}
                </p>
              ) : null}
            </div>
            </section>
          </section>
        </div>
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

function CommandMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-3 block font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <div className="pixel-box flex min-h-[3.6rem] items-center bg-white/5 px-4 py-3">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-none tracking-[-0.04em] text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function CompareRowItem({
  label,
  value,
  className = "font-mono text-sm text-white",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 md:hidden">
        {label}
      </p>
      <p className={`mt-2 truncate md:mt-0 ${className}`.trim()}>
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
