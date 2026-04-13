import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const refreshMock = vi.fn();
const resetMock = vi.fn();

vi.mock("@/hooks/useYieldPay", () => ({
  useYieldPay: () => ({
    refresh: refreshMock,
    reset: resetMock,
    data: null,
    error: null,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-vault-catalog", () => ({
  useVaultCatalog: () => ({
    error: null,
    isLoading: false,
    vaults: [],
  }),
}));

vi.mock("@/components/home/asset-inventory", () => ({
  AssetInventory: ({
    onSelectionChange,
  }: {
    onSelectionChange?: (selection: unknown[]) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelectionChange?.([
          {
            amount: "1.5",
            availableAmount: "10",
            chainId: 137,
            tokenAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            tokenDecimals: 6,
            tokenName: "USD Coin",
            tokenSymbol: "USDC",
          },
        ])
      }
    >
      Select Asset
    </button>
  ),
}));

vi.mock("@/lib/wallet/ui-context", () => ({
  useWalletUi: () => ({
    evmAddress: "0x1234567890123456789012345678901234567890",
    connectEvm: vi.fn(),
  }),
}));

vi.mock("wagmi", () => ({
  createConfig: vi.fn((input) => input),
  http: vi.fn(() => ({})),
  useAccount: () => ({
    address: "0x1234567890123456789012345678901234567890",
    chainId: 8453,
  }),
  useConnectorClient: () => ({
    data: null,
  }),
  usePublicClient: () => ({
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
  }),
  useSendTransaction: () => ({
    sendTransactionAsync: vi.fn(),
  }),
  useSwitchChain: () => ({
    switchChainAsync: vi.fn(),
  }),
  useWriteContract: () => ({
    writeContractAsync: vi.fn(),
  }),
}));

vi.mock("@pxlkit/core", () => ({
  ParallaxPxlKitIcon: () => null,
}));

vi.mock("@/components/icons/retro-tv", () => ({
  RetroTV: () => null,
}));

vi.mock("@/components/rb/Shuffle", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/components/shared/terminal-button", () => ({
  TerminalButton: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/wallet/connect-wallet-button", () => ({
  ConnectWalletButton: () => <button type="button">Connect Wallet</button>,
}));

import { HomeScreen } from "./home-screen";
import { CHAINS } from "@/lib/constants";

describe("HomeScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refreshMock.mockReset();
    resetMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requests a quote from the selected inventory asset into the selected vault", async () => {
    refreshMock.mockResolvedValue(null);

    render(<HomeScreen />);

    fireEvent.click(screen.getByRole("button", { name: /select asset/i }));
    fireEvent.click(screen.getByRole("button", { name: /aave usdc/i }));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(refreshMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: "1.5",
        fromChainId: CHAINS.POLYGON,
        targetProtocol: "Aave",
      }),
    );
  });
});
