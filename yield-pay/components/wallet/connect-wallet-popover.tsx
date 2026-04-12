"use client";

import { useWalletUi } from "@/lib/wallet/ui-context";

export function ConnectWalletPopover() {
  const {
    isOpen,
    close,
    evmLabel,
    evmConnectorName,
    connectInjectedWallet,
    disconnectEvm,
  } = useWalletUi();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 top-full z-10 mt-3 w-72 border border-white/10 bg-[#161616] p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Wallet access
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Connect an external wallet to get the live Base quote and execute the route.
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close wallet selector"
          className="text-xs uppercase tracking-[0.2em] text-zinc-500 transition hover:text-white"
        >
          x
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {evmLabel ? (
          <>
            <div className="border border-white/10 bg-white/5 px-3 py-3 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Wallet Active
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text)]">
                {evmLabel}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {evmConnectorName ?? "Wallet connected"}
              </p>
            </div>
            <button
              type="button"
              onClick={disconnectEvm}
              className="border border-white/10 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
            >
              Disconnect wallet
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={connectInjectedWallet}
              className="border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/8 px-3 py-3 text-left"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Connect
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text)]">
                Connect Wallet
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Uses MetaMask, Rabby, Coinbase Wallet, or another injected / WalletConnect flow.
              </p>
            </button>
          </>
        )}
        <div className="border border-dashed border-white/10 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Solana coming later
        </div>
      </div>
    </div>
  );
}
