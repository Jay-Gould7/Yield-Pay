"use client";

import { Wallet } from "lucide-react";

import { TerminalButton } from "@/components/shared/terminal-button";
import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

import { ConnectWalletPopover } from "./connect-wallet-popover";

export function ConnectWalletButton() {
  const { toggle, evmAddress } = useWalletUi();

  return (
    <div className="relative">
      <TerminalButton className="w-full gap-2" onClick={toggle}>
        <Wallet className="size-4" />
        {formatWalletSummary({ evmAddress })}
      </TerminalButton>
      <ConnectWalletPopover />
    </div>
  );
}
