# Wallet Providers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dual-chain wallet provider infrastructure for EVM and Solana, wire the bottom-left sidebar wallet button to a chain-selection popover, and replace the hard-coded topbar badge with live wallet status.

**Architecture:** The app keeps `app/layout.tsx` as a server component and mounts a client-only `WalletProviders` wrapper beneath it. Chain-specific providers from `wagmi` and Solana Wallet Adapter live inside that wrapper, while a small app-owned wallet UI context exposes formatted state and popover actions to shell components.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, TanStack Query, wagmi, viem, @solana/wallet-adapter-react, @solana/wallet-adapter-wallets, @solana/web3.js, Vitest, Testing Library

---

## File Map

- Create: `components/providers/wallet-providers.tsx`
- Create: `components/wallet/connect-wallet-button.tsx`
- Create: `components/wallet/connect-wallet-popover.tsx`
- Create: `components/wallet/wallet-status-badge.tsx`
- Create: `lib/wallet/config.ts`
- Create: `lib/wallet/format.ts`
- Create: `lib/wallet/ui-context.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/topbar.tsx`
- Modify: `package.json`

### Task 1: Install Wallet Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add wallet dependencies to `package.json`**

```json
{
  "dependencies": {
    "@solana/wallet-adapter-base": "^0.9.27",
    "@solana/wallet-adapter-react": "^0.15.39",
    "@solana/wallet-adapter-wallets": "^0.19.37",
    "@solana/web3.js": "^1.98.4",
    "viem": "^2.38.6",
    "wagmi": "^2.18.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.0.1",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Run install to refresh the lockfile**

Run: `npm install`
Expected: install completes and `package-lock.json` updates with the wallet packages

- [ ] **Step 3: Commit dependency changes**

```bash
git add package.json package-lock.json
git commit -m "feat: add wallet provider dependencies"
```

### Task 2: Add Test Runner Foundation

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Write the failing test command hook**

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Add Vitest config and setup**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Run the test command to verify the runner is wired**

Run: `npm test`
Expected: completes without test execution errors and reports no test files found yet

- [ ] **Step 4: Commit the test foundation**

```bash
git add package.json vitest.config.ts vitest.setup.ts
git commit -m "test: add vitest foundation"
```

### Task 3: Add Formatting Utilities With Tests

**Files:**
- Create: `lib/wallet/format.ts`
- Test: `lib/wallet/format.test.ts`

- [ ] **Step 1: Write the failing test for wallet label formatting**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/wallet/format.test.ts`
Expected: FAIL because `lib/wallet/format.ts` does not exist yet

- [ ] **Step 3: Write the minimal formatter implementation**

```ts
type WalletSummaryInput = {
  evmAddress?: string | null;
  solanaAddress?: string | null;
};

function shorten(value: string, start: number, end: number) {
  if (value.length <= start + end) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatEvmAddress(address?: string | null) {
  return address ? shorten(address, 6, 4) : null;
}

export function formatSolanaAddress(address?: string | null) {
  return address ? shorten(address, 4, 4) : null;
}

export function formatWalletSummary({
  evmAddress,
  solanaAddress,
}: WalletSummaryInput) {
  if (evmAddress && solanaAddress) {
    return "EVM+SOL";
  }

  if (evmAddress) {
    return `EVM ${formatEvmAddress(evmAddress)}`;
  }

  if (solanaAddress) {
    return `SOL ${formatSolanaAddress(solanaAddress)}`;
  }

  return "Connect_Wallet";
}
```

- [ ] **Step 4: Run the formatter test to verify it passes**

Run: `npx vitest run lib/wallet/format.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the formatter utility**

```bash
git add lib/wallet/format.ts lib/wallet/format.test.ts
git commit -m "feat: add wallet label formatters"
```

### Task 4: Add Wallet Provider Configuration

**Files:**
- Create: `lib/wallet/config.ts`
- Test: `lib/wallet/config.test.ts`

- [ ] **Step 1: Write the failing test for provider config exports**

```ts
import { describe, expect, it } from "vitest";

import { evmChains, solanaEndpoint } from "./config";

describe("wallet config", () => {
  it("exports at least one EVM chain", () => {
    expect(evmChains.length).toBeGreaterThan(0);
  });

  it("exports a Solana rpc endpoint", () => {
    expect(solanaEndpoint.startsWith("http")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/wallet/config.test.ts`
Expected: FAIL because `lib/wallet/config.ts` does not exist yet

- [ ] **Step 3: Write the minimal wallet config**

```ts
import { mainnet } from "wagmi/chains";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export const evmChains = [mainnet] as const;

export const solanaNetwork = WalletAdapterNetwork.Mainnet;

export const solanaEndpoint = clusterApiUrl(solanaNetwork);
```

- [ ] **Step 4: Run the config test to verify it passes**

Run: `npx vitest run lib/wallet/config.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the provider config**

```bash
git add lib/wallet/config.ts lib/wallet/config.test.ts
git commit -m "feat: add wallet provider config"
```

### Task 5: Create App Wallet UI Context

**Files:**
- Create: `lib/wallet/ui-context.tsx`
- Test: `lib/wallet/ui-context.test.tsx`

- [ ] **Step 1: Write the failing test for wallet UI state**

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  WalletUiProvider,
  useWalletUi,
} from "./ui-context";

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/wallet/ui-context.test.tsx`
Expected: FAIL because `lib/wallet/ui-context.tsx` does not exist yet

- [ ] **Step 3: Write the minimal wallet UI context**

```tsx
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type WalletUiContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const WalletUiContext = createContext<WalletUiContextValue | null>(null);

export function WalletUiProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((current) => !current),
    }),
    [isOpen],
  );

  return (
    <WalletUiContext.Provider value={value}>
      {children}
    </WalletUiContext.Provider>
  );
}

export function useWalletUi() {
  const context = useContext(WalletUiContext);

  if (!context) {
    throw new Error("useWalletUi must be used within WalletUiProvider");
  }

  return context;
}
```

- [ ] **Step 4: Run the context test to verify it passes**

Run: `npx vitest run lib/wallet/ui-context.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the UI context**

```bash
git add lib/wallet/ui-context.tsx lib/wallet/ui-context.test.tsx
git commit -m "feat: add wallet ui context"
```

### Task 6: Create Client Wallet Providers

**Files:**
- Create: `components/providers/wallet-providers.tsx`
- Modify: `app/layout.tsx`
- Test: `components/providers/wallet-providers.test.tsx`

- [ ] **Step 1: Write the failing test for the provider wrapper**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WalletProviders } from "./wallet-providers";

describe("WalletProviders", () => {
  it("renders children inside the provider tree", () => {
    render(
      <WalletProviders>
        <div>provider-child</div>
      </WalletProviders>,
    );

    expect(screen.getByText("provider-child")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/providers/wallet-providers.test.tsx`
Expected: FAIL because `components/providers/wallet-providers.tsx` does not exist yet

- [ ] **Step 3: Write the provider wrapper and mount it in layout**

```tsx
// components/providers/wallet-providers.tsx
"use client";

import { useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { evmChains, solanaEndpoint } from "@/lib/wallet/config";
import { WalletUiProvider } from "@/lib/wallet/ui-context";

const wagmiConfig = createConfig({
  chains: [...evmChains],
  connectors: [injected()],
  transports: {
    [evmChains[0].id]: http(),
  },
});

export function WalletProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [solanaWallets] = useState(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectionProvider endpoint={solanaEndpoint}>
          <WalletProvider wallets={solanaWallets} autoConnect={false}>
            <WalletUiProvider>{children}</WalletUiProvider>
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

```tsx
// app/layout.tsx
import { WalletProviders } from "@/components/providers/wallet-providers";

<body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
  <WalletProviders>{children}</WalletProviders>
</body>
```

- [ ] **Step 4: Run the provider test to verify it passes**

Run: `npx vitest run components/providers/wallet-providers.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the provider tree**

```bash
git add components/providers/wallet-providers.tsx components/providers/wallet-providers.test.tsx app/layout.tsx
git commit -m "feat: mount dual-chain wallet providers"
```

### Task 7: Build the Sidebar Connect Popover

**Files:**
- Create: `components/wallet/connect-wallet-button.tsx`
- Create: `components/wallet/connect-wallet-popover.tsx`
- Modify: `components/layout/sidebar.tsx`
- Test: `components/wallet/connect-wallet-button.test.tsx`

- [ ] **Step 1: Write the failing test for the sidebar wallet trigger**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

    expect(screen.getByText("Choose wallet family")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect evm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect solana/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/wallet/connect-wallet-button.test.tsx`
Expected: FAIL because the button component does not exist yet

- [ ] **Step 3: Write the connect button, popover, and sidebar integration**

```tsx
// components/wallet/connect-wallet-button.tsx
"use client";

import { Wallet } from "lucide-react";

import { TerminalButton } from "@/components/shared/terminal-button";
import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

import { ConnectWalletPopover } from "./connect-wallet-popover";

export function ConnectWalletButton() {
  const { toggle, evmAddress, solanaAddress } = useWalletUi();

  return (
    <div className="relative">
      <TerminalButton className="w-full gap-2" onClick={toggle}>
        <Wallet className="size-4" />
        {formatWalletSummary({ evmAddress, solanaAddress })}
      </TerminalButton>
      <ConnectWalletPopover />
    </div>
  );
}
```

```tsx
// components/wallet/connect-wallet-popover.tsx
"use client";

import { useWalletUi } from "@/lib/wallet/ui-context";

export function ConnectWalletPopover() {
  const { isOpen, close } = useWalletUi();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute bottom-16 left-0 w-72 border border-white/10 bg-[#161616] p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Choose wallet family
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Connect either EVM or Solana without leaving the shell.
          </p>
        </div>
        <button type="button" onClick={close} aria-label="Close wallet selector">
          x
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <button type="button" className="border border-white/10 px-3 py-3 text-left">
          Connect EVM
        </button>
        <button type="button" className="border border-white/10 px-3 py-3 text-left">
          Connect Solana
        </button>
      </div>
    </div>
  );
}
```

```tsx
// components/layout/sidebar.tsx
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

<div className="border-t border-white/5 p-6">
  <ConnectWalletButton />
</div>
```

- [ ] **Step 4: Run the sidebar wallet test to verify it passes**

Run: `npx vitest run components/wallet/connect-wallet-button.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the connect popover UI**

```bash
git add components/wallet/connect-wallet-button.tsx components/wallet/connect-wallet-popover.tsx components/wallet/connect-wallet-button.test.tsx components/layout/sidebar.tsx
git commit -m "feat: add sidebar wallet connect popover"
```

### Task 8: Connect Real EVM And Solana Actions

**Files:**
- Modify: `lib/wallet/ui-context.tsx`
- Modify: `components/wallet/connect-wallet-popover.tsx`
- Test: `components/wallet/connect-wallet-popover.test.tsx`

- [ ] **Step 1: Write the failing test for disconnect and connected status rendering**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: "0x1234567890abcdef1234567890abcdef12345678", isConnected: true }),
  useConnect: () => ({ connect: vi.fn(), connectors: [{ uid: "injected", name: "Injected", type: "injected" }] }),
  useDisconnect: () => ({ disconnect: vi.fn() }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: { toBase58: () => "7Fh3YkQ2mN8xX4pqT1LMsV7cNzQK9pQ" },
    connected: true,
    disconnect: vi.fn(),
    wallets: [],
    select: vi.fn(),
    connect: vi.fn(),
  }),
}));

import { WalletUiProvider } from "@/lib/wallet/ui-context";
import { ConnectWalletPopover } from "./connect-wallet-popover";

describe("ConnectWalletPopover", () => {
  it("shows connected wallet summaries", () => {
    render(
      <WalletUiProvider initialOpen>
        <ConnectWalletPopover />
      </WalletUiProvider>,
    );

    expect(screen.getByText("EVM 0x1234...5678")).toBeInTheDocument();
    expect(screen.getByText("SOL 7Fh3...K9pQ")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/wallet/connect-wallet-popover.test.tsx`
Expected: FAIL because real wallet state is not yet exposed through the UI context

- [ ] **Step 3: Extend the wallet UI context and popover with real actions**

```tsx
// lib/wallet/ui-context.tsx
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  formatEvmAddress,
  formatSolanaAddress,
} from "@/lib/wallet/format";

type WalletUiContextValue = {
  isOpen: boolean;
  evmAddress: string | null;
  solanaAddress: string | null;
  evmLabel: string | null;
  solanaLabel: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  connectEvm: () => void;
  connectSolana: () => Promise<void>;
  disconnectEvm: () => void;
  disconnectSolana: () => Promise<void>;
};

const { address, isConnected } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();
const solanaWallet = useWallet();

const evmAddress = isConnected ? address ?? null : null;
const solanaAddress = solanaWallet.connected
  ? solanaWallet.publicKey?.toBase58() ?? null
  : null;

connectEvm: () => {
  const connector = connectors.find((item) => item.type === "injected") ?? connectors[0];
  if (connector) {
    connect({ connector });
  }
},
connectSolana: async () => {
  const wallet = solanaWallet.wallets[0];
  if (!wallet) {
    throw new Error("No Solana wallet available");
  }
  solanaWallet.select(wallet.adapter.name);
  await solanaWallet.connect();
},
disconnectEvm: () => disconnect(),
disconnectSolana: () => solanaWallet.disconnect(),
evmLabel: formatEvmAddress(evmAddress),
solanaLabel: formatSolanaAddress(solanaAddress),
```

```tsx
// components/wallet/connect-wallet-popover.tsx
const {
  isOpen,
  close,
  evmLabel,
  solanaLabel,
  connectEvm,
  connectSolana,
  disconnectEvm,
  disconnectSolana,
} = useWalletUi();

{evmLabel ? (
  <button type="button" onClick={disconnectEvm}>
    EVM {evmLabel}
  </button>
) : (
  <button type="button" onClick={connectEvm}>
    Connect EVM
  </button>
)}

{solanaLabel ? (
  <button type="button" onClick={() => void disconnectSolana()}>
    SOL {solanaLabel}
  </button>
) : (
  <button type="button" onClick={() => void connectSolana()}>
    Connect Solana
  </button>
)}
```

- [ ] **Step 4: Run the popover test to verify it passes**

Run: `npx vitest run components/wallet/connect-wallet-popover.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the live wallet actions**

```bash
git add lib/wallet/ui-context.tsx components/wallet/connect-wallet-popover.tsx components/wallet/connect-wallet-popover.test.tsx
git commit -m "feat: wire evm and solana wallet actions"
```

### Task 9: Replace The Topbar Mock With Live Wallet Status

**Files:**
- Create: `components/wallet/wallet-status-badge.tsx`
- Modify: `components/layout/topbar.tsx`
- Test: `components/wallet/wallet-status-badge.test.tsx`

- [ ] **Step 1: Write the failing test for the topbar wallet badge**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wallet/ui-context", () => ({
  useWalletUi: () => ({
    evmAddress: "0x1234567890abcdef1234567890abcdef12345678",
    solanaAddress: null,
  }),
}));

import { WalletStatusBadge } from "./wallet-status-badge";

describe("WalletStatusBadge", () => {
  it("renders the connected wallet summary", () => {
    render(<WalletStatusBadge />);
    expect(screen.getByText("EVM 0x1234...5678")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/wallet/wallet-status-badge.test.tsx`
Expected: FAIL because the badge component does not exist yet

- [ ] **Step 3: Write the badge component and topbar integration**

```tsx
// components/wallet/wallet-status-badge.tsx
"use client";

import { Wallet } from "lucide-react";

import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

export function WalletStatusBadge() {
  const { evmAddress, solanaAddress } = useWalletUi();

  return (
    <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
      <Wallet className="size-4" />
      <span>{formatWalletSummary({ evmAddress, solanaAddress })}</span>
    </div>
  );
}
```

```tsx
// components/layout/topbar.tsx
import { WalletStatusBadge } from "@/components/wallet/wallet-status-badge";

<WalletStatusBadge />
```

- [ ] **Step 4: Run the topbar badge test to verify it passes**

Run: `npx vitest run components/wallet/wallet-status-badge.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the topbar wallet badge**

```bash
git add components/wallet/wallet-status-badge.tsx components/wallet/wallet-status-badge.test.tsx components/layout/topbar.tsx
git commit -m "feat: replace topbar wallet mock"
```

### Task 10: Final Verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `app/layout.tsx`
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/layout/topbar.tsx`
- Create: `components/providers/wallet-providers.tsx`
- Create: `components/wallet/connect-wallet-button.tsx`
- Create: `components/wallet/connect-wallet-popover.tsx`
- Create: `components/wallet/wallet-status-badge.tsx`
- Create: `lib/wallet/config.ts`
- Create: `lib/wallet/format.ts`
- Create: `lib/wallet/ui-context.tsx`

- [ ] **Step 1: Run the targeted wallet tests**

Run: `npx vitest run lib/wallet/format.test.ts lib/wallet/config.test.ts lib/wallet/ui-context.test.tsx components/providers/wallet-providers.test.tsx components/wallet/connect-wallet-button.test.tsx components/wallet/connect-wallet-popover.test.tsx components/wallet/wallet-status-badge.test.tsx`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run a production build**

Run: `npm run build`
Expected: PASS aside from any pre-existing external font fetch issue unrelated to wallet changes

- [ ] **Step 4: Commit the final integrated feature**

```bash
git add package.json package-lock.json app/layout.tsx components/layout/sidebar.tsx components/layout/topbar.tsx components/providers/wallet-providers.tsx components/wallet/connect-wallet-button.tsx components/wallet/connect-wallet-popover.tsx components/wallet/wallet-status-badge.tsx lib/wallet/config.ts lib/wallet/format.ts lib/wallet/ui-context.tsx
git commit -m "feat: add dual-chain wallet providers"
```
