# Wallet Providers Design

**Date:** 2026-04-11

## Goal

Add real wallet provider infrastructure for both EVM and Solana, then connect the existing bottom-left `Connect_Wallet` sidebar control to a lightweight chain-selection popover. This phase covers connection state only, not transaction signing or settlement.

## Scope

In scope:
- Add a shared client-side provider tree for EVM and Solana wallets
- Expose wallet connection state to the app shell
- Replace the sidebar's static `Connect_Wallet` control with a working connect UI
- Show connected wallet status in the sidebar popover and topbar
- Support connect and disconnect flows for both chains

Out of scope:
- Transaction signing
- Allowance management
- Chain switching automation
- Backend session persistence
- Portfolio aggregation across chains

## Current Context

The app currently renders shell UI from [app/layout.tsx](/home/igor/github/Yield-Pay/yield-pay/app/layout.tsx), [components/layout/app-shell.tsx](/home/igor/github/Yield-Pay/yield-pay/components/layout/app-shell.tsx), [components/layout/sidebar.tsx](/home/igor/github/Yield-Pay/yield-pay/components/layout/sidebar.tsx), and [components/layout/topbar.tsx](/home/igor/github/Yield-Pay/yield-pay/components/layout/topbar.tsx). The wallet UI is entirely mock-driven today:

- The sidebar renders a static `Connect_Wallet` button
- The topbar renders a hard-coded address badge
- No wallet libraries are installed
- No shared client provider exists

## Approach Options

### Option A: Real dual-stack providers with a unified app adapter

Use `wagmi` for EVM and Solana Wallet Adapter for Solana, then wrap both behind a small app-specific client context that exposes the active connection summary used by the shell.

Pros:
- Uses standard libraries for each ecosystem
- Keeps chain-specific logic contained
- Leaves a clean path toward trading flows later

Cons:
- More setup than a fake context
- Requires careful client-only boundaries in Next.js

### Option B: Temporary custom context with mocked connect actions

Add only an app-local context and fake wallet state transitions without any real wallet libraries.

Pros:
- Fastest implementation
- No dependency setup

Cons:
- Does not satisfy the actual provider requirement
- Would need to be replaced before real integration

### Option C: Separate chain-specific UI paths without a unifying adapter

Mount both ecosystems independently and let components read from each library directly.

Pros:
- Minimal abstraction

Cons:
- Shell components become tightly coupled to multiple wallet APIs
- Harder to maintain consistent status and connect UX

### Recommendation

Use Option A. It keeps the implementation real while still constraining scope to connection state. The extra adapter layer should stay small and focused on UI-facing state, not on abstracting every wallet action.

## Architecture

### Provider Composition

Create a client component `WalletProviders` mounted from the root layout. It will wrap the application in:

- `QueryClientProvider` for wallet library query needs
- `WagmiProvider` for EVM
- `ConnectionProvider`, `WalletProvider`, and optional modal provider for Solana
- A small app-level `WalletUiProvider` that normalizes shell-facing state

The root layout remains a server component and only delegates the provider tree to a client boundary.

### App Wallet UI State

The app-level wallet context will not replace the underlying libraries. Its job is only to:

- Track whether the connect popover is open
- Track the selected wallet family for the current connect flow
- Expose display-ready connection summaries
- Provide `open`, `close`, and `disconnect` actions for the shell

This keeps the shell components isolated from library-specific data formatting.

### Shell Integration

The left sidebar control becomes a client component that:

- Opens a popover on click
- Shows two primary actions: `EVM` and `Solana`
- Shows current connected account snippets when available
- Offers disconnect for each connected family

The topbar wallet badge will read from the same app wallet UI state. It should stop showing the hard-coded `0x...4F2E` value and instead show:

- The active connected wallet if exactly one family is connected
- A compact dual-state label if both are connected
- A disconnected placeholder if neither is connected

## User Interaction

### Default State

The sidebar bottom-left control shows `Connect_Wallet`.

Clicking it opens a compact popover with:
- A short title
- A brief note explaining the app supports both wallet families
- Two primary buttons: `Connect EVM` and `Connect Solana`

### Connected State

When a wallet is connected:
- The sidebar trigger label changes to the connected summary
- The popover shows status rows for connected families
- Each connected family gets a disconnect action

Formatting rules:
- EVM addresses should render as `0x1234...abcd`
- Solana public keys should render as `7Fh3...K9pQ`

### Failure Handling

If a connect request fails or no wallet is available:
- Keep the popover open
- Show a brief inline error message in the popover
- Do not crash the shell

Errors remain local to the wallet popover in this phase.

## Library Choices

### EVM

- `wagmi`
- `viem`

Use injected connector support first. That covers browser wallets like MetaMask-compatible providers without committing to a more opinionated modal system.

### Solana

- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-wallets`

Use the standard wallet adapter stack so the app is aligned with common Solana integration patterns.

## File Design

Planned new files:
- `components/providers/wallet-providers.tsx`
- `components/wallet/connect-wallet-button.tsx`
- `components/wallet/connect-wallet-popover.tsx`
- `components/wallet/wallet-status-badge.tsx`
- `lib/wallet/format.ts`
- `lib/wallet/config.ts`
- `lib/wallet/ui-context.tsx`

Planned modified files:
- `app/layout.tsx`
- `components/layout/sidebar.tsx`
- `components/layout/topbar.tsx`
- `package.json`

## Testing Strategy

This phase needs targeted UI tests rather than real wallet end-to-end coverage.

Required verification:
- The sidebar renders the wallet trigger from provider-backed state
- The popover opens and shows both connect options
- Connected summaries render with the correct short format
- Disconnect actions clear the displayed state

For library-level wallet behavior, tests should mock the underlying hooks instead of trying to open real browser wallets in CI.

## Risks And Mitigations

### Next.js Client Boundaries

Risk:
- Wallet libraries are client-only and can break if imported into server components

Mitigation:
- Keep all wallet providers and wallet UI components behind explicit client components

### Solana Wallet Adapter Styling

Risk:
- The default adapter UI may conflict with the current design language

Mitigation:
- Use adapter logic but keep the visible trigger and popover app-owned

### Divergent Dual-Chain State

Risk:
- EVM and Solana can be connected independently, which complicates the topbar display

Mitigation:
- Define explicit display rules for zero, one, or two active families

## Success Criteria

This feature is successful when:
- The app boots with both EVM and Solana wallet providers mounted
- The sidebar bottom-left control opens a wallet-family popover
- EVM and Solana connection flows can be initiated from that popover
- Connected state appears in the sidebar and topbar without hard-coded wallet text
- Disconnecting either family updates the shell immediately
