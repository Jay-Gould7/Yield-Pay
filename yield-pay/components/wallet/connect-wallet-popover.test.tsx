import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x1234567890abcdef1234567890abcdef12345678",
    isConnected: true,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [{ uid: "injected", name: "Injected", type: "injected" }],
  }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

import { WalletUiProvider } from "@/lib/wallet/ui-context";
import { ConnectWalletPopover } from "./connect-wallet-popover";

describe("ConnectWalletPopover", () => {
  it("shows the connected EVM summary and the deferred Solana note", () => {
    render(
      <WalletUiProvider initialOpen>
        <ConnectWalletPopover />
      </WalletUiProvider>,
    );

    expect(screen.getByText("EVM 0x1234...5678")).toBeInTheDocument();
    expect(screen.getByText("Solana coming later")).toBeInTheDocument();
  });
});
