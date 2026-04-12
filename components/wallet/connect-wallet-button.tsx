"use client";

import { TerminalButton } from "@/components/shared/terminal-button";
import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

import { ConnectWalletPopover } from "./connect-wallet-popover";

type ConnectWalletButtonProps = {
  className?: string;
};

export function ConnectWalletButton({
  className = "",
}: ConnectWalletButtonProps) {
  const { toggle, evmAddress } = useWalletUi();
  const buttonClassName = className ? `gap-2 ${className}` : "w-full gap-2";

  return (
    <div className="relative">
      <TerminalButton className={buttonClassName} onClick={toggle}>
        {formatWalletSummary({ evmAddress })}
      </TerminalButton>
      <ConnectWalletPopover />
    </div>
  );
}
