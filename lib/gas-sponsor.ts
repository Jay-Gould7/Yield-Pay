export const DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI = 150_000_000_000_000n; // 0.00015 ETH
export const DEFAULT_GAS_SPONSOR_TARGET_BALANCE_WEI = 350_000_000_000_000n; // 0.00035 ETH

export function computeSponsorTopUpWei({
  currentBalanceWei,
  minBalanceWei,
  targetBalanceWei,
}: {
  currentBalanceWei: bigint;
  minBalanceWei: bigint;
  targetBalanceWei: bigint;
}) {
  if (minBalanceWei <= 0n || targetBalanceWei <= minBalanceWei) {
    throw new Error("Invalid sponsor threshold configuration.");
  }

  if (currentBalanceWei >= minBalanceWei) {
    return 0n;
  }

  return targetBalanceWei - currentBalanceWei;
}

export function parseOptionalWei(value: unknown, fallback: bigint) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Invalid Wei number.");
    }
    return BigInt(Math.floor(value));
  }

  if (typeof value === "string") {
    if (!/^\d+$/.test(value)) {
      throw new Error("Wei value must be an integer string.");
    }
    return BigInt(value);
  }

  throw new Error("Unsupported Wei value type.");
}
