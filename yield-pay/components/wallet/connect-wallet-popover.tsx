"use client";

import { useWalletUi } from "@/lib/wallet/ui-context";

export function ConnectWalletPopover() {
  const {
    isOpen,
    close,
    evmLabel,
    connectEvm,
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
            Connect an EVM wallet without leaving the shell.
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
          <button
            type="button"
            onClick={disconnectEvm}
            className="border border-white/10 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
          >
            EVM {evmLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={connectEvm}
            className="border border-white/10 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text)]"
          >
            Connect EVM
          </button>
        )}
        <div className="border border-dashed border-white/10 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          Solana coming later
        </div>
      </div>
    </div>
  );
}
