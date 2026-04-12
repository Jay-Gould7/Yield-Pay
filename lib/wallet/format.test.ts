import { describe, expect, it } from "vitest";

import {
  formatEvmAddress,
  formatSolanaAddress,
  formatWalletSummary,
} from "./format";

describe("wallet formatters", () => {
  it("shortens an EVM address to the expected shell format", () => {
    expect(formatEvmAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(
      "0x1234...5678",
    );
  });

  it("shortens a Solana address to the expected shell format", () => {
    expect(formatSolanaAddress("7Fh3YkQ2mN8xX4pqT1LMsV7cNzQK9pQ")).toBe(
      "7Fh3...K9pQ",
    );
  });

  it("formats dual-chain connected state for the topbar badge", () => {
    expect(
      formatWalletSummary({
        evmAddress: "0x1234567890abcdef1234567890abcdef12345678",
        solanaAddress: "7Fh3YkQ2mN8xX4pqT1LMsV7cNzQK9pQ",
      }),
    ).toBe("EVM+SOL");
  });
});
