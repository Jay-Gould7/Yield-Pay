import { describe, expect, it } from "vitest";

import { deriveBreakEvenDaysFromYieldBasis } from "./calculations";

describe("deriveBreakEvenDaysFromYieldBasis", () => {
  it("scales break-even days by the currently selected asset amount", () => {
    const days = deriveBreakEvenDaysFromYieldBasis({
      amountUsd: 100,
      basisAmountUsd: 10_000,
      dailyYieldUsd: 10,
      estimatedCostUsd: 2,
    });

    expect(days).toBeCloseTo(20, 6);
  });

  it("returns Infinity for invalid inputs", () => {
    const days = deriveBreakEvenDaysFromYieldBasis({
      amountUsd: 0,
      basisAmountUsd: 10_000,
      dailyYieldUsd: 10,
      estimatedCostUsd: 2,
    });

    expect(days).toBe(Number.POSITIVE_INFINITY);
  });
});
