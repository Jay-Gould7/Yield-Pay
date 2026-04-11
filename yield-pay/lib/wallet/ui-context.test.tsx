import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
  useConnect: () => ({ connect: vi.fn(), connectors: [] }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

import { WalletUiProvider, useWalletUi } from "./ui-context";

describe("wallet ui context", () => {
  it("opens and closes the wallet popover", () => {
    const { result } = renderHook(() => useWalletUi(), {
      wrapper: ({ children }) => <WalletUiProvider>{children}</WalletUiProvider>,
    });

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});
