import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useConnect: () => ({ connect: vi.fn(), connectors: [] }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

import { WalletUiProvider } from "@/lib/wallet/ui-context";
import { ConnectWalletButton } from "./connect-wallet-button";

describe("ConnectWalletButton", () => {
  it("opens the wallet selection popover", () => {
    render(
      <WalletUiProvider>
        <ConnectWalletButton />
      </WalletUiProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /connect_wallet/i }));

    expect(screen.getByText("Wallet access")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connect evm/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Solana coming later")).toBeInTheDocument();
  });
});
