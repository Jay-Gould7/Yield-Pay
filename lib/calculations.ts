export type BreakEvenEstimateInput = {
  amountUsd: number;
  apy: number;
  baseCost: number;
  chainMultiplier: number;
  tokenMultiplier: number;
};

export type BreakEvenEstimate = {
  annualYieldUsd: number;
  dailyYieldUsd: number;
  estimatedCostUsd: number;
  breakEvenDays: number;
  recoveryProgress24h: number;
};

export function calculateBreakEvenEstimate({
  amountUsd,
  apy,
  baseCost,
  chainMultiplier,
  tokenMultiplier,
}: BreakEvenEstimateInput): BreakEvenEstimate {
  const annualYieldUsd = amountUsd * (apy / 100);
  const dailyYieldUsd = annualYieldUsd / 365;
  const estimatedCostUsd = baseCost * chainMultiplier * tokenMultiplier;
  const breakEvenDays =
    dailyYieldUsd > 0 ? estimatedCostUsd / dailyYieldUsd : Number.POSITIVE_INFINITY;
  const recoveryProgress24h =
    estimatedCostUsd > 0
      ? Math.min(100, (dailyYieldUsd / estimatedCostUsd) * 100)
      : 0;

  return {
    annualYieldUsd,
    dailyYieldUsd,
    estimatedCostUsd,
    breakEvenDays,
    recoveryProgress24h,
  };
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatCompactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 2,
  }).format(value);
}

export function formatBreakEvenWindow(days: number) {
  if (!Number.isFinite(days)) {
    return "Not available";
  }

  if (days < 1) {
    return `${Math.max(1, Math.round(days * 24))} hours`;
  }

  return `${days.toFixed(1)} days`;
}

export function formatHoursUntilProfit(days: number) {
  if (!Number.isFinite(days)) {
    return "later";
  }

  return `${Math.max(1, Math.ceil(days * 24))} hours`;
}
