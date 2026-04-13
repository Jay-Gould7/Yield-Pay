import { CHAINS } from "@/lib/constants";
import type { Vault } from "@/lib/types";

export type VaultCategory =
  | "recommend"
  | "lending"
  | "vaults"
  | "liquid-staking"
  | "yield"
  | "staking";

type EarnVaultProtocol = {
  name: string;
};

type EarnVaultAnalytics = {
  apy: {
    total: number;
  };
  tvl: {
    usd: number | string;
  };
};

export type EarnVaultCatalogEntry = {
  address: string;
  analytics: EarnVaultAnalytics;
  asset: string;
  chainId: number;
  isTransactional: boolean;
  name: string;
  protocol: EarnVaultProtocol;
};

export function buildVaultCatalog(entries: EarnVaultCatalogEntry[]) {
  const deduped = new Map<string, Vault>();

  for (const entry of entries) {
    if (!entry.isTransactional) {
      continue;
    }

    const vault = mapEarnVault(entry);
    const existing = deduped.get(vault.id);

    if (!existing || parsePercent(vault.apy) > parsePercent(existing.apy)) {
      deduped.set(vault.id, vault);
    }
  }

  return [...deduped.values()].sort(
    (left, right) => parsePercent(right.apy) - parsePercent(left.apy),
  );
}

export function classifyVaultCategory(protocolName: string): VaultCategory {
  const normalized = protocolName.trim().toLowerCase();

  if (normalized.includes("lido") || normalized.includes("etherfi")) {
    return "liquid-staking";
  }

  if (
    normalized.includes("aave") ||
    normalized.includes("euler") ||
    normalized.includes("hyperlend") ||
    normalized.includes("maple") ||
    normalized.includes("seamless")
  ) {
    return "lending";
  }

  if (
    normalized.includes("morpho") ||
    normalized.includes("felix") ||
    normalized.includes("neverland")
  ) {
    return "vaults";
  }

  if (
    normalized.includes("pendle") ||
    normalized.includes("ethena") ||
    normalized.includes("usdai") ||
    normalized.includes("vkhype")
  ) {
    return "yield";
  }

  if (normalized.includes("kinetiq")) {
    return "staking";
  }

  return "vaults";
}

function mapEarnVault(entry: EarnVaultCatalogEntry): Vault {
  const category = classifyVaultCategory(entry.protocol.name);
  const protocol = cleanProtocolName(entry.protocol.name);
  const apyDecimal = normalizeApyDecimal(entry.analytics.apy.total);
  const apyPercent = apyDecimal * 100;
  const estimatedGasUsd = deriveGasEstimate(category);
  const projectedPrincipalUsd = 10_000;
  const dailyYieldUsd = projectedPrincipalUsd * (apyDecimal / 365);
  const breakEvenDays = dailyYieldUsd > 0 ? estimatedGasUsd / dailyYieldUsd : 0;

  return {
    analysisTitle: `Live LI.FI Earn route on ${formatChainLabel(entry.chainId)}`,
    apy: `${apyPercent.toFixed(2)}%`,
    breakEven: breakEvenDays > 0 ? `${breakEvenDays.toFixed(1)} DAYS` : "N/A",
    breakEvenWidth: `${deriveBreakEvenWidth(apyDecimal)}%`,
    category,
    confidence: deriveConfidence(entry.analytics.tvl.usd),
    dailyYield: `+$${dailyYieldUsd.toFixed(2)}`,
    estGas: `$${estimatedGasUsd.toFixed(2)}`,
    id: `${protocol.toLowerCase()}-${entry.chainId}-${entry.address.toLowerCase()}`,
    name: cleanVaultName(entry.name, protocol, entry.asset),
    netApr: `${Math.max(0, apyPercent - 0.5).toFixed(2)}%`,
    network: formatChainLabel(entry.chainId),
    overheadUsd: formatUsd(estimatedGasUsd),
    protocol,
    riskTier: deriveRiskTier(category, entry.analytics.tvl.usd),
    status: "LIVE_EARN",
    statusTone: "accent",
    summary: `${protocol} ${entry.asset} deposit opportunity discovered from LI.FI Earn. TVL ${formatTvl(entry.analytics.tvl.usd)}; card metrics use a $10K deployment model for comparison.`,
    targetAsset: entry.asset,
    targetChainId: entry.chainId,
    vaultAddress: entry.address,
  };
}

function cleanProtocolName(protocolName: string) {
  return protocolName.replace(/\s+/g, " ").trim();
}

function cleanVaultName(vaultName: string, protocol: string, asset: string) {
  const cleaned = vaultName.replace(new RegExp(protocol, "ig"), "").trim();
  return cleaned || `${protocol} ${asset}`;
}

function deriveGasEstimate(category: VaultCategory) {
  switch (category) {
    case "liquid-staking":
      return 42.1;
    case "lending":
      return 37.84;
    case "yield":
      return 34.26;
    case "staking":
      return 28.4;
    case "vaults":
    case "recommend":
    default:
      return 31.18;
  }
}

function deriveBreakEvenWidth(apyDecimal: number) {
  return Math.min(96, Math.max(12, Math.round(apyDecimal * 650)));
}

function deriveConfidence(tvl: number | string) {
  const amount = parseUsd(tvl);

  if (amount >= 1_000_000_000) {
    return "99.2%";
  }

  if (amount >= 100_000_000) {
    return "97.4%";
  }

  if (amount >= 10_000_000) {
    return "94.8%";
  }

  return "89.5%";
}

function deriveRiskTier(category: VaultCategory, tvl: number | string) {
  const amount = parseUsd(tvl);

  if (category === "liquid-staking" || amount >= 1_000_000_000) {
    return "Low";
  }

  if (category === "yield" || amount < 10_000_000) {
    return "High";
  }

  return "Mid";
}

function formatChainLabel(chainId: number) {
  const labels: Record<number, string> = {
    [CHAINS.ETHEREUM]: "Ethereum",
    [CHAINS.BASE]: "Base",
    [CHAINS.ARBITRUM]: "Arbitrum",
    [CHAINS.OPTIMISM]: "Optimism",
    [CHAINS.POLYGON]: "Polygon",
  };

  return labels[chainId] ?? `Chain ${chainId}`;
}

function formatTvl(value: number | string) {
  const amount = parseUsd(value);

  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  return formatUsd(amount);
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function parsePercent(value: string) {
  return Number.parseFloat(value.replace("%", "")) || 0;
}

function parseUsd(value: number | string) {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeApyDecimal(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  // LI.FI Earn currently returns percentage values (e.g. 16.63), not decimal fractions.
  return value > 1 ? value / 100 : value;
}
