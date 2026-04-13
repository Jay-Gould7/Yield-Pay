"use client";

import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="wallet-popover-frame technical-grid absolute right-0 top-[calc(100%+0.65rem)] z-[180] w-[min(88vw,23rem)] overflow-hidden p-4 md:p-5"
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="wallet-popover-title text-[11px] uppercase text-white">
                Wallet Access
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Base Execution Gateway
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close wallet selector"
              className="wallet-popover-close pixel-box grid size-9 place-items-center bg-white/5 font-mono text-[11px] uppercase text-zinc-300 transition hover:text-white"
            >
              X
            </button>
          </div>

          
          
          
          

          <div className="mt-5 grid gap-3">
            {evmLabel ? (
              <>
                <div className="pixel-box bg-white/4 px-4 py-4 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    Wallet Active
                  </p>
                  <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-text)]">
                    {evmLabel}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {evmConnectorName ?? "Wallet connected"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={disconnectEvm}
                  className="wallet-popover-action pixel-box bg-white/4 px-4 py-4 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]"
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={connectInjectedWallet}
                className="wallet-popover-action wallet-popover-connect pixel-box px-4 py-4 text-left"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#042415]">
                  Connect
                </p>
                <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.18em] text-[#031b11]">
                  Connect Wallet
                </p>
                <p className="mt-2 text-sm leading-6 text-[#083523]">
                  MetaMask, Rabby, Coinbase Wallet, or WalletConnect-compatible flows.
                </p>
              </button>
            )}

            <div className="pixel-box border-dashed bg-white/0 px-4 py-4 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                Secondary Access
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                Solana Coming Later
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
