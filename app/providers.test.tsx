import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@rainbow-me/rainbowkit", () => ({
  RainbowKitProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    globalThis.localStorage.getItem("rk-recent");
    return <>{children}</>;
  },
  darkTheme: () => ({}),
}));

vi.mock("wagmi", () => ({
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class {},
  QueryClientProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
}));

vi.mock("@/lib/wallet/ui-context", () => ({
  WalletUiProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
}));

vi.mock("./config/wagmi", () => ({
  config: {},
}));

import { Providers } from "./providers";

describe("Providers", () => {
  it("does not render RainbowKit on the server when localStorage is unavailable", () => {
    const originalLocalStorage = globalThis.localStorage;

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {},
    });

    expect(() =>
      renderToString(
        <Providers>
          <div>safe content</div>
        </Providers>,
      ),
    ).not.toThrow();

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  });
});
