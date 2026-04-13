import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const openConnectModal = vi.fn();
const openAccountModal = vi.fn();
const disconnect = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, connector: undefined, isConnected: false }),
  useDisconnect: () => ({ disconnect }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  useAccountModal: () => ({ openAccountModal }),
  useConnectModal: () => ({ openConnectModal }),
}));

import { WalletUiProvider, useWalletUi } from "./ui-context";

describe("wallet ui context", () => {
  it("opens the RainbowKit connect modal when disconnected", () => {
    const { result } = renderHook(() => useWalletUi(), {
      wrapper: ({ children }) => <WalletUiProvider>{children}</WalletUiProvider>,
    });

    act(() => result.current.open());
    expect(openConnectModal).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it("disconnects the active wallet", () => {
    const { result } = renderHook(() => useWalletUi(), {
      wrapper: ({ children }) => <WalletUiProvider>{children}</WalletUiProvider>,
    });

    act(() => result.current.disconnectEvm());
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
