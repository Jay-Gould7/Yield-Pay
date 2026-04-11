"use client";

import { Wallet } from "lucide-react";

import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

export function WalletStatusBadge() {
  const { evmAddress } = useWalletUi();

  return (
    <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
      <Wallet className="size-4" />
      <span>{formatWalletSummary({ evmAddress })}</span>
    </div>
  );
}
