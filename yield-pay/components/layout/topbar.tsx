import Link from "next/link";

import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#131313]/84 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <div>
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.08em] text-[var(--color-accent)]"
          >
            YIELD_PAY
          </Link>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            Future_yield_covers_today&apos;s_gas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 sm:block">
            Single action / route-ready
          </div>
          <ConnectWalletButton className="w-auto px-5" />
        </div>
      </div>
    </header>
  );
}
