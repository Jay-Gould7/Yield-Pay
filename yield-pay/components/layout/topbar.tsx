import { Bell } from "lucide-react";

import { WalletStatusBadge } from "@/components/wallet/wallet-status-badge";

export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#131313]/80 px-6 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="size-1.5 bg-[var(--color-accent)]" />
          <span>TVL: $1.24B</span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="size-1.5 bg-[var(--color-accent)]" />
          <span>Gas_Saved: $42.1M</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="grid size-10 place-items-center border border-white/5 bg-white/5 text-zinc-400 transition hover:text-[var(--color-accent)]"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
        <WalletStatusBadge />
      </div>
    </header>
  );
}
