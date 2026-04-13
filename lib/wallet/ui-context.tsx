"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import {
  useAccountModal,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

import { formatEvmAddress } from "./format";

type WalletUiContextValue = {
  isOpen: boolean;
  evmAddress: string | null;
  evmConnectorName: string | null;
  evmLabel: string | null;
  hasStaleInjectedConnection: boolean;
  hasOkxProvider: boolean;
  walletError: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  connectEvm: () => void;
  connectInjectedWallet: () => void;
  connectWalletConnect: () => void;
  disconnectEvm: () => void;
};

const WalletUiContext = createContext<WalletUiContextValue | null>(null);

type WalletUiProviderProps = PropsWithChildren<{
  initialOpen?: boolean;
}>;

export function WalletUiProvider({
  children,
}: WalletUiProviderProps) {
  const { address, connector, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openAccountModal } = useAccountModal();
  const { openConnectModal } = useConnectModal();

  const evmAddress = isConnected ? address ?? null : null;
  const evmConnectorName = isConnected ? connector?.name ?? null : null;

  const openWalletModal = () => {
    if (isConnected) {
      openAccountModal?.();
      return;
    }

    openConnectModal?.();
  };

  const value: WalletUiContextValue = {
    isOpen: false,
    evmAddress,
    evmConnectorName,
    evmLabel: formatEvmAddress(evmAddress),
    hasStaleInjectedConnection: false,
    hasOkxProvider: false,
    walletError: null,
    open: openWalletModal,
    close: () => undefined,
    toggle: openWalletModal,
    connectEvm: () => {
      openConnectModal?.();
    },
    connectInjectedWallet: () => {
      openConnectModal?.();
    },
    connectWalletConnect: () => {
      openConnectModal?.();
    },
    disconnectEvm: () => {
      disconnect();
    },
  };

  return (
    <WalletUiContext.Provider value={value}>
      {children}
    </WalletUiContext.Provider>
  );
}

export function getWalletErrorMessage() {
  return null;
}

export function useWalletUi() {
  const context = useContext(WalletUiContext);

  if (!context) {
    throw new Error("useWalletUi must be used within WalletUiProvider");
  }

  return context;
}
