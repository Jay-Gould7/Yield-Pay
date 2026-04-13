import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const openConnectModal = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, connector: undefined, isConnected: false }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useAccountModal: () => ({ openAccountModal: vi.fn() }),
  useConnectModal: () => ({ openConnectModal }),
}));

import { WalletUiProvider } from "@/lib/wallet/ui-context";
import { ConnectWalletButton } from "./connect-wallet-button";

describe("ConnectWalletButton", () => {
  it("opens the RainbowKit connect modal", () => {
    render(
      <WalletUiProvider>
        <ConnectWalletButton />
      </WalletUiProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /connect_wallet/i }));

    expect(openConnectModal).toHaveBeenCalledTimes(1);
  });
});
