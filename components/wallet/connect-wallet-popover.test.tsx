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
  it("stays hidden when wallet UI is modal-driven", () => {
    render(
      <WalletUiProvider initialOpen>
        <ConnectWalletPopover />
      </WalletUiProvider>,
    );

    expect(screen.queryByText("Wallet access")).not.toBeInTheDocument();
  });
});
