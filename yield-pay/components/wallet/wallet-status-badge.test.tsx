import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wallet/ui-context", () => ({
  useWalletUi: () => ({
    evmAddress: "0x1234567890abcdef1234567890abcdef12345678",
  }),
}));

import { WalletStatusBadge } from "./wallet-status-badge";

describe("WalletStatusBadge", () => {
  it("renders the connected wallet summary", () => {
    render(<WalletStatusBadge />);
    expect(screen.getByText("EVM 0x1234...5678")).toBeInTheDocument();
  });
});
