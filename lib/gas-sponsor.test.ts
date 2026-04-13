import { describe, expect, it } from "vitest";

import {
  computeSponsorTopUpWei,
  DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI,
  DEFAULT_GAS_SPONSOR_TARGET_BALANCE_WEI,
  parseOptionalWei,
} from "./gas-sponsor";

describe("computeSponsorTopUpWei", () => {
  it("returns zero when current balance already meets threshold", () => {
    const topUp = computeSponsorTopUpWei({
      currentBalanceWei: DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI,
      minBalanceWei: DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI,
      targetBalanceWei: DEFAULT_GAS_SPONSOR_TARGET_BALANCE_WEI,
    });

    expect(topUp).toBe(0n);
  });

  it("tops up to target when below minimum", () => {
    const topUp = computeSponsorTopUpWei({
      currentBalanceWei: 10n,
      minBalanceWei: 100n,
      targetBalanceWei: 250n,
    });

    expect(topUp).toBe(240n);
  });
});

describe("parseOptionalWei", () => {
  it("uses fallback for empty value", () => {
    expect(parseOptionalWei(undefined, 123n)).toBe(123n);
  });

  it("parses integer string value", () => {
    expect(parseOptionalWei("456", 123n)).toBe(456n);
  });
});
