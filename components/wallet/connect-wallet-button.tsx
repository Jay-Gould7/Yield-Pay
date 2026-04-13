"use client";

import { useEffect, useRef } from "react";

import { ConnectWalletPopover } from "@/components/wallet/connect-wallet-popover";
import { TerminalButton } from "@/components/shared/terminal-button";
import { formatWalletSummary } from "@/lib/wallet/format";
import { useWalletUi } from "@/lib/wallet/ui-context";

type ConnectWalletButtonProps = {
  className?: string;
};

export function ConnectWalletButton({
  className = "",
}: ConnectWalletButtonProps) {
  const { close, isOpen, toggle, evmAddress } = useWalletUi();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const walletSummary = formatWalletSummary({ evmAddress });
  const buttonClassName = className
    ? `wallet-trigger-button gap-2 ${className}`
    : "wallet-trigger-button w-full gap-2";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <TerminalButton
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={buttonClassName}
        onClick={toggle}
      >
        <span className="wallet-trigger-content">
          <span className={`wallet-trigger-led ${evmAddress ? "is-connected" : ""}`.trim()} />
          <span className="wallet-trigger-copy">
            <span className="wallet-trigger-label">Wallet</span>
            <span className="wallet-trigger-value">{walletSummary}</span>
          </span>
          <span className="wallet-trigger-corner" aria-hidden="true">
            {isOpen ? "ON" : "GO"}
          </span>
        </span>
      </TerminalButton>
      <ConnectWalletPopover />
    </div>
  );
}
