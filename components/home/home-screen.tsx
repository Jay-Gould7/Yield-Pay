"use client";

import { ParallaxPxlKitIcon } from "@pxlkit/core";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
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

import {
  AssetInventory,
  type AssetQuoteSelection,
} from "@/components/home/asset-inventory";
import { QuoteModal } from "@/components/home/quote-modal";
import { useYieldPay, type YieldPaySourceToken } from "@/hooks/useYieldPay";
import { useVaultCatalog } from "@/hooks/use-vault-catalog";
import { RetroTV } from "@/components/icons/retro-tv";
import Shuffle from "@/components/rb/Shuffle";
import { TerminalButton } from "@/components/shared/terminal-button";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import {
  calculateBreakEvenEstimate,
  deriveBreakEvenDaysFromYieldBasis,
  formatBreakEvenWindow,
  formatUsd,
} from "@/lib/calculations";
import { CHAINS } from "@/lib/constants";
import {
  executionPhases,
  homeVaults,
  sourceChains,
} from "@/lib/home-data";
import {
  classifyVaultCategory,
  type VaultCategory,
} from "@/lib/vault-catalog";
import { useWalletUi } from "@/lib/wallet/ui-context";

type HomeScreenProps = {
  initialCompareOpen?: boolean;
  initialExecutionOpen?: boolean;
  initialVaultId?: string;
};

type CompareItem = {
  basisAmountUsd: number;
  dailyYieldUsd: number;
  estimatedCostUsd: number;
  id: string;
  isLive: boolean;
  label: string;
  note: string;
  protocol: string;
  targetAsset?: string;
  targetChainId?: number;
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
  const { refresh, reset, data: liveQuote, error: liveError, isLoading: isQuoteLoading } =
    useYieldPay();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const [selectedProtocol, setSelectedProtocol] = useState(
    homeVaults.find((vault) => vault.id === initialVaultId)?.protocol ?? "",
  );
  const [selectedVaultAddress, setSelectedVaultAddress] = useState<Address | null>(
    null,
  );
  const [selectedTargetAsset, setSelectedTargetAsset] = useState("USDC");
  const [selectedTargetChainId, setSelectedTargetChainId] = useState<number>(CHAINS.BASE);
  const [activeVaultCategory, setActiveVaultCategory] =
    useState<VaultCategory>("recommend");
  const [assetSelections, setAssetSelections] = useState<AssetQuoteSelection[]>([]);
  const [executionStep, setExecutionStep] = useState<number | null>(
    initialExecutionOpen ? 0 : null,
  );
  const [executionNotes, setExecutionNotes] = useState<ExecutionNotes>({});
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<Hash | null>(null);
  const [routeHash, setRouteHash] = useState<Hash | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [sponsorAddress, setSponsorAddress] = useState<string | null>(null);
  const [sponsorBalanceEth, setSponsorBalanceEth] = useState<string | null>(null);
  const lastSelectionKeyRef = useRef<string | null>(null);

  const selectedAsset = useMemo(
    () =>
      assetSelections.find((selection) => {
        const amount = Number(selection.amount.replace(/,/g, ""));
        return Number.isFinite(amount) && amount > 0;
      }) ?? null,
    [assetSelections],
  );
  const selectedSourceChainId = selectedAsset?.chainId ?? CHAINS.BASE;
  const selectedSourceChain =
    sourceChains.find((chainOption) => chainOption.chainId === selectedSourceChainId) ??
    sourceChains[0];
  const sourcePublicClient = usePublicClient({ chainId: selectedSourceChainId });
  const parsedAmount = Number(selectedAsset?.amount.replace(/,/g, "") ?? "");
  const amountValue = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const normalizedAmount = amountValue > 0 ? selectedAsset?.amount.trim() ?? "" : "";
  const walletAddress = (accountAddress ?? evmAddress ?? undefined) as Address | undefined;
  const sourceTokenSymbol = normalizeSourceTokenSymbol(selectedAsset?.tokenSymbol);
  const {
    error: vaultCatalogError,
    isLoading: isVaultCatalogLoading,
    vaults: catalogVaults,
  } = useVaultCatalog([]);

  const fallbackVaultOutcomes = useMemo(
    () =>
      homeVaults
        .map((vault) => ({
          vault,
          estimate: calculateBreakEvenEstimate({
            amountUsd: amountValue,
            apy: vault.apy,
            baseCost: vault.baseCost,
            chainMultiplier: selectedSourceChain.costMultiplier,
            tokenMultiplier:
              selectedAsset?.tokenSymbol === selectedSourceChain.nativeSymbol ? 1.28 : 1,
          }),
        }))
        .sort((left, right) => left.estimate.breakEvenDays - right.estimate.breakEvenDays),
    [
      amountValue,
      selectedAsset?.tokenSymbol,
      selectedSourceChain.costMultiplier,
      selectedSourceChain.nativeSymbol,
    ],
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
        const apyDecimal = normalizeApyDecimal(vault.analytics.apy.total);
        const dailyYieldUsd = liveQuote.principalUsd * (apyDecimal / 365);
        const breakEvenDays =
          dailyYieldUsd > 0
            ? liveQuote.totalFeesUsd / dailyYieldUsd
            : Number.POSITIVE_INFINITY;

        return {
          basisAmountUsd: liveQuote.principalUsd,
          dailyYieldUsd,
          estimatedCostUsd: liveQuote.totalFeesUsd,
          id: vault.address,
          isLive: true,
          label: vault.name,
          note: `Live Earn API vault using the current ${selectedSourceChain.label} quote fee snapshot.`,
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
  }, [liveQuote, selectedSourceChain.label]);

  const fallbackCompareItems = useMemo<CompareItem[]>(
    () =>
      fallbackVaultOutcomes.map((item) => ({
        basisAmountUsd: amountValue,
        dailyYieldUsd: item.estimate.dailyYieldUsd,
        estimatedCostUsd: item.estimate.estimatedCostUsd,
        id: item.vault.id,
        isLive: false,
        label: item.vault.name,
        note: item.vault.reason,
        protocol: item.vault.protocol,
        value: formatBreakEvenWindow(item.estimate.breakEvenDays),
      })),
    [amountValue, fallbackVaultOutcomes],
  );

  const catalogCompareItems = useMemo<CompareItem[]>(
    () =>
      catalogVaults.map((vault) => ({
        basisAmountUsd: 10_000,
        dailyYieldUsd: parseUsdLabel(vault.dailyYield),
        estimatedCostUsd: parseUsdLabel(vault.estGas),
        id: vault.id,
        isLive: true,
        label: vault.name,
        note: vault.summary,
        protocol: vault.protocol,
        targetAsset: vault.targetAsset,
        targetChainId: vault.targetChainId,
        value: vault.breakEven,
        vaultAddress: vault.vaultAddress as Address | undefined,
      })),
    [catalogVaults],
  );

  const compareItems: CompareItem[] = catalogCompareItems.length
    ? catalogCompareItems
    : liveCompareItems ?? fallbackCompareItems;
  const selectedCompareItem =
    compareItems.find((item) =>
      item.vaultAddress
        ? selectedVaultAddress === item.vaultAddress
        : selectedProtocol === item.protocol,
    ) ?? null;
  const availableVaultCategories = useMemo(
    () => getAvailableVaultCategories(compareItems),
    [compareItems],
  );
  const visibleVaultCategory = availableVaultCategories.includes(activeVaultCategory)
    ? activeVaultCategory
    : "recommend";
  const visibleCompareItems = useMemo(
    () =>
      visibleVaultCategory === "recommend"
        ? compareItems.slice(0, 6)
        : compareItems.filter(
            (item) => getCompareItemCategory(item) === visibleVaultCategory,
          ),
    [compareItems, visibleVaultCategory],
  );
  const activeProtocol =
    selectedProtocol || selectedCompareItem?.protocol || selectedFallbackOutcome?.vault.protocol || "";
  const activeVaultName =
    liveQuote?.selectedVault.name ??
    selectedCompareItem?.label ??
    selectedFallbackOutcome?.vault.name;
  const activeProtocolName =
    liveQuote?.selectedVault.protocol.name ??
    selectedCompareItem?.protocol ??
    selectedFallbackOutcome?.vault.protocol;
  const activeNetwork =
    liveQuote
      ? `Chain ${liveQuote.selectedVault.chainId}`
      : selectedCompareItem?.targetChainId
        ? formatChainLabel(selectedCompareItem.targetChainId)
        : selectedFallbackOutcome?.vault.network;
  const activeApyPercent =
    liveQuote?.apyPercent ??
    (selectedCompareItem ? parsePercentLabel(deriveApyFromDailyYield(selectedCompareItem)) : null) ??
    selectedFallbackOutcome?.vault.apy ??
    0;
  const activeCostUsd =
    liveQuote?.totalFeesUsd ??
    selectedCompareItem?.estimatedCostUsd ??
    selectedFallbackOutcome?.estimate.estimatedCostUsd ??
    0;
  const selectedCompareBreakEvenDays = toFiniteNumberOrNull(
    selectedCompareItem
      ? deriveBreakEvenDaysFromYieldBasis({
          amountUsd: amountValue,
          basisAmountUsd: selectedCompareItem.basisAmountUsd,
          dailyYieldUsd: selectedCompareItem.dailyYieldUsd,
          estimatedCostUsd: selectedCompareItem.estimatedCostUsd,
        })
      : null,
  );
  const liveBreakEvenDays = toFiniteNumberOrNull(liveQuote?.breakEvenDays);
  const fallbackBreakEvenDays = toFiniteNumberOrNull(
    selectedFallbackOutcome?.estimate.breakEvenDays,
  );
  const activeBreakEvenDays =
    liveBreakEvenDays ??
    selectedCompareBreakEvenDays ??
    fallbackBreakEvenDays ??
    0;
  const activeBreakEvenLabel =
    selectedAsset && selectedCompareItem
      ? formatBreakEvenWindow(activeBreakEvenDays)
      : "......";
  const sponsorBalanceLabel = useMemo(() => {
    if (!sponsorBalanceEth) {
      return "Unavailable";
    }

    const parsed = Number.parseFloat(sponsorBalanceEth);
    if (!Number.isFinite(parsed)) {
      return "Unavailable";
    }

    return `${parsed.toFixed(6)} ETH`;
  }, [sponsorBalanceEth]);
  const activeDailyYieldUsd =
    liveQuote?.principalUsd && liveQuote?.apyDecimal
      ? liveQuote.principalUsd * (liveQuote.apyDecimal / 365)
      : selectedCompareItem?.dailyYieldUsd ?? selectedFallbackOutcome?.estimate.dailyYieldUsd ?? 0;
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
    : !selectedAsset
      ? "Select Source Asset"
      : !selectedCompareItem
        ? "Select Target Vault"
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

  const resetExecutionState = useCallback(() => {
    setApprovalHash(null);
    setExecutionError(null);
    setExecutionNotes({});
    setExecutionStep(null);
    setIsExecuting(false);
    setRouteHash(null);
  }, []);

  const setExecutionNote = (phaseId: ExecutionPhaseId, detail: string) => {
    setExecutionNotes((current) => ({
      ...current,
      [phaseId]: detail,
    }));
  };

  const readRouteAllowance = async (owner: Address, spender: Address, tokenAddress: Address) => {
    if (!sourcePublicClient) {
      throw new Error(`${formatChainLabel(selectedSourceChainId)} public client is unavailable.`);
    }

    return sourcePublicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      args: [owner, spender],
      functionName: "allowance",
    });
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchSponsorBalance = async () => {
      try {
        const response = await fetch("/api/gas-sponsor?chainId=1");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          address?: string;
          balanceEth?: string;
        };

        if (isCancelled) {
          return;
        }

        setSponsorAddress(payload.address ?? null);
        setSponsorBalanceEth(payload.balanceEth ?? null);
      } catch {
        if (!isCancelled) {
          setSponsorBalanceEth(null);
        }
      }
    };

    void fetchSponsorBalance();

    const timer = window.setInterval(() => {
      void fetchSponsorBalance();
    }, 30_000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const requestLiveQuote = useEffectEvent(async () => {
    if (
      !walletAddress ||
      !normalizedAmount ||
      !activeProtocol ||
      !selectedAsset ||
      !selectedCompareItem
    ) {
      return;
    }

    await refresh({
      amount: normalizedAmount,
      fromChainId: selectedAsset.chainId,
      fromTokenAddress: selectedAsset.tokenAddress as Address,
      fromTokenDecimals: selectedAsset.tokenDecimals,
      fromTokenSymbol: sourceTokenSymbol,
      targetProtocol: activeProtocol,
      targetVaultAddress: selectedVaultAddress ?? undefined,
      targetAsset: selectedTargetAsset,
      toChainId: selectedTargetChainId,
    });
  });

  useEffect(() => {
    if (
      !walletAddress ||
      !normalizedAmount ||
      !activeProtocol ||
      !selectedAsset ||
      !selectedCompareItem
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void requestLiveQuote();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    activeProtocol,
    normalizedAmount,
    selectedAsset,
    selectedCompareItem,
    selectedVaultAddress,
    selectedTargetAsset,
    selectedTargetChainId,
    walletAddress,
  ]);

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

  const handleAssetSelectionChange = useCallback((selection: AssetQuoteSelection[]) => {
    const nextSelectionKey = JSON.stringify(selection);

    if (nextSelectionKey === lastSelectionKeyRef.current) {
      return;
    }

    lastSelectionKeyRef.current = nextSelectionKey;
    reset();
    resetExecutionState();
    setAssetSelections(selection);
  }, [reset, resetExecutionState]);

  const handleCompareSelection = (item: CompareItem) => {
    reset();
    resetExecutionState();
    setSelectedProtocol(item.protocol);
    setSelectedVaultAddress(item.vaultAddress ?? null);
    setSelectedTargetAsset(item.targetAsset ?? "USDC");
    setSelectedTargetChainId(item.targetChainId ?? CHAINS.BASE);
  };

  const handlePrimaryAction = async () => {
    if (!selectedAsset || !selectedCompareItem || amountValue <= 0) {
      return;
    }

    if (!isQuoteModalOpen) {
      setIsQuoteModalOpen(true);
      return;
    }

    if (!walletAddress) {
      connectEvm();
      return;
    }

    if (
      isExecutionRunning ||
      amountValue <= 0 ||
      !selectedAsset ||
      !selectedCompareItem ||
      !activeProtocol
    ) {
      return;
    }

    let executableQuote = liveQuote;

    if (!hasExecutableQuote) {
      const result = await refresh({
        amount: normalizedAmount || "0.02",
        fromChainId: selectedAsset.chainId,
        fromTokenAddress: selectedAsset.tokenAddress as Address,
        fromTokenDecimals: selectedAsset.tokenDecimals,
        fromTokenSymbol: sourceTokenSymbol,
        targetAsset: selectedTargetAsset,
        targetProtocol: activeProtocol,
        targetVaultAddress: selectedVaultAddress ?? undefined,
        toChainId: selectedTargetChainId,
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
      chainId === selectedAsset.chainId
        ? `Wallet connected on ${formatChainLabel(selectedAsset.chainId)}. Preparing the LI.FI execution payload.`
        : `Switching the connected wallet to ${formatChainLabel(selectedAsset.chainId)} so the route can execute.`,
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
          `Checking ${executableQuote.fromToken.symbol} allowance on ${formatChainLabel(
            executableQuote.fromChainId,
          )} before execution.`,
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
          )}. Waiting for ${formatChainLabel(executableQuote.fromChainId)} confirmation.`,
        );

        if (!sourcePublicClient) {
          throw new Error(
            `${formatChainLabel(executableQuote.fromChainId)} public client is unavailable.`,
          );
        }

        await sourcePublicClient.waitForTransactionReceipt({
          hash: nextApprovalHash,
        });

        setExecutionNote(
          "approval",
          `Approval confirmed on ${formatChainLabel(
            executableQuote.fromChainId,
          )}. ${executableQuote.fromToken.symbol} is now spendable for this route.`,
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
        `Route submitted: ${formatHashLabel(nextRouteHash)}. Waiting for ${formatChainLabel(
          executionChainId,
        )} confirmation.`,
      );

      if (!sourcePublicClient) {
        throw new Error(`${formatChainLabel(executionChainId)} public client is unavailable.`);
      }

      await sourcePublicClient.waitForTransactionReceipt({
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
        <section className="relative py-0">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[var(--color-accent)]/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <h1 className="pixel-hero-heading max-w-5xl">
              <span className="pixel-hero-copy">
                <span className="pixel-hero-line">This move pays</span>
                <span className="pixel-hero-line">for itself in</span>
              </span>
              <Shuffle
                key={activeBreakEvenLabel}
                text={activeBreakEvenLabel}
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
              <div className="group relative">
                <span className="pixel-chip inline-flex cursor-default items-center bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                  Sponsor
                </span>
                <div className="absolute right-0 top-full z-20 mt-2 hidden min-w-[16rem] border border-white/10 bg-[var(--color-bg-elevated)]/95 p-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.35)] group-hover:block group-focus-within:block">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                    Sponsor Balance (Ethereum)
                  </p>
                  <p className="mt-2 font-mono text-sm text-white">
                    {sponsorBalanceLabel}
                  </p>
                  <p className="mt-2 truncate font-mono text-[10px] text-zinc-500">
                    {sponsorAddress ?? "Address unavailable"}
                  </p>
                </div>
              </div>
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

        <AssetInventory onSelectionChange={handleAssetSelectionChange} />

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
	                  {selectedAsset
                      ? `${selectedAsset.amount} ${selectedAsset.tokenSymbol} into ${activeVaultName ?? "selected vault"}`
                      : "Select an asset from inventory"}
	                </p>
	                <p className="mt-2 text-sm leading-7 text-zinc-400">
	                  {selectedCompareItem
                      ? `${activeProtocolName} / ${activeNetwork} / Target: ${selectedTargetAsset}`
                      : "Choose a vault from the matrix to populate execution details."}
	                </p>
	              </div>
              <span className="pixel-chip bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {routeStateLabel}
              </span>
            </div>

	            <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
	              <div className="space-y-4">
	                <CommandMetric
	                  label="Source Asset"
	                  value={
                      selectedAsset
                        ? `${selectedAsset.amount} ${selectedAsset.tokenSymbol}`
                        : "None"
                    }
	                />
	                <CommandMetric
	                  label="Source Chain"
	                  value={selectedAsset ? formatChainLabel(selectedAsset.chainId) : "Select Asset"}
	                />
	                <CommandMetric
	                  label="Target Vault"
	                  value={selectedCompareItem?.label ?? "Select Vault"}
	                />
	              </div>

              <div className="space-y-4">
                <CommandMetric
                  label="Principal"
                  value={formatUsd(activePrincipalUsd)}
                />
                <CommandMetric
                  label="Break-even"
                  value={activeBreakEvenLabel}
                />
	                <CommandMetric
	                  label="Live APY"
	                  value={`${activeApyPercent.toFixed(2)}%`}
	                />
	                <CommandMetric
	                  label="Est. Cost"
	                  value={formatUsd(activeCostUsd)}
	                />
	              </div>
	            </div>

            <div className="mt-6 flex flex-col gap-3">
              <TerminalButton
                className="w-full justify-center gap-3 py-4 text-[12px]"
	                disabled={
	                  !selectedAsset ||
                    !selectedCompareItem ||
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
	                    : selectedAsset && selectedCompareItem
                        ? `Connected. Waiting for the live ${formatChainLabel(selectedAsset.chainId)} quote to finish.`
                        : "Select one source asset and one vault to build the live quote."
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

            <div className="mt-6 flex flex-wrap gap-2">
              {availableVaultCategories.map((category) => (
                <button
                  key={category}
                  className={`pixel-box bg-white/5 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] ${
                    visibleVaultCategory === category
                      ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                      : "text-zinc-500"
                  }`}
                  onClick={() => setActiveVaultCategory(category)}
                  type="button"
                >
                  {vaultCategoryLabels[category]}
                </button>
              ))}
            </div>

            <div className="pixel-box mt-6 overflow-hidden bg-white/[0.02]">
              <div className="hidden grid-cols-[1.65fr_0.75fr_0.85fr_0.85fr_0.65fr] gap-4 border-b border-white/8 bg-white/4 px-5 py-3 md:grid">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Name
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  APY
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

              <div className="max-h-[28rem] overflow-y-auto overscroll-contain">
                {visibleCompareItems.map((item) => {
                  const isSelected = item.vaultAddress
                    ? selectedVaultAddress === item.vaultAddress ||
                      liveQuote?.selectedVault.address === item.vaultAddress
                    : selectedProtocol === item.protocol;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleCompareSelection(item)}
                      className={`group w-full border-b border-white/8 px-5 py-3 text-left transition last:border-b-0 ${
                        isSelected
                          ? "bg-[var(--color-accent)]/8 shadow-[inset_2px_0_0_var(--color-accent)]"
                          : "border-white/10 bg-white/0 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="grid gap-3 md:grid-cols-[1.65fr_0.75fr_0.85fr_0.85fr_0.65fr] md:items-center">
                        <div className="min-w-0">
                          <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.04em] text-white">
                            {item.label}
                          </p>
                          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            {item.protocol} / {item.targetChainId ? formatChainLabel(item.targetChainId) : "Model"}
                          </p>
                        </div>
                        <CompareRowItem
                          label="APY"
                          value={deriveApyFromDailyYield(item)}
                          className="font-mono text-sm text-[var(--color-accent)]"
                        />
                        <CompareRowItem
                          label="Break-even"
                          value={item.value}
                          className="font-mono text-sm text-white"
                        />
                        <CompareRowItem
                          label="Daily Yield"
                          value={`${formatUsd(item.dailyYieldUsd)}/day`}
                          className="font-mono text-sm text-white"
                        />
                        <CompareRowItem
                          label="Source"
                          value={item.isLive ? "LIVE" : "MODEL"}
                          className={`inline-flex w-fit border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                            item.isLive
                              ? "border-[var(--color-accent)]/30 text-[var(--color-accent)]"
                              : "border-white/10 text-zinc-500"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
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
              {!liveError && vaultCatalogError ? (
                <p className="mt-4 border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-sm text-[var(--color-danger)]">
                  {vaultCatalogError}
                </p>
              ) : null}
              {isVaultCatalogLoading ? (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Loading LI.FI Earn vault catalog...
                </p>
              ) : null}
            </div>
            </section>
        </section>
      </div>
      <QuoteModal
        preloadedBreakEvenDays={toFiniteNumberOrNull(activeBreakEvenDays)}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        selections={assetSelections}
        targetAsset={selectedTargetAsset}
        targetChainId={selectedTargetChainId}
        targetProtocol={activeProtocol}
        targetVaultAddress={selectedVaultAddress ?? undefined}
        vaultLabel={activeVaultName ?? "Selected Vault"}
        vaultSubtitle={activeProtocolName ?? "Protocol"}
      />
    </div>
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

function parseUsdLabel(value: string) {
  const parsed = Number.parseFloat(value.replace(/[$,+]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePercentLabel(value: string) {
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeApyDecimal(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return value > 1 ? value / 100 : value;
}

function toFiniteNumberOrNull(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeSourceTokenSymbol(symbol?: string): YieldPaySourceToken {
  return symbol === "ETH" ||
    symbol === "MATIC" ||
    symbol === "BNB" ||
    symbol === "AVAX"
    ? symbol
    : "USDC";
}

const vaultCategoryLabels: Record<VaultCategory, string> = {
  "liquid-staking": "Liquid Staking",
  lending: "Lending",
  recommend: "Recommend",
  staking: "Staking",
  vaults: "Vaults",
  yield: "Yield",
};

const vaultCategoryOrder: VaultCategory[] = [
  "recommend",
  "lending",
  "vaults",
  "liquid-staking",
  "yield",
  "staking",
];

function getAvailableVaultCategories(items: CompareItem[]) {
  const categories = new Set<VaultCategory>();

  for (const item of items) {
    categories.add(getCompareItemCategory(item));
  }

  return vaultCategoryOrder.filter(
    (category) => category === "recommend" || categories.has(category),
  );
}

function getCompareItemCategory(item: CompareItem) {
  return classifyVaultCategory(item.protocol);
}

function deriveApyFromDailyYield(item: CompareItem) {
  const principal = 10_000;
  const apy = (item.dailyYieldUsd * 365 * 100) / principal;

  if (!Number.isFinite(apy) || apy <= 0) {
    return "-";
  }

  return `${apy.toFixed(2)}%`;
}

function formatChainLabel(chainId: number) {
  const matchedChain = sourceChains.find((chain) => chain.chainId === chainId);

  return matchedChain ? `${matchedChain.label} (${chainId})` : `Chain ${chainId}`;
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
