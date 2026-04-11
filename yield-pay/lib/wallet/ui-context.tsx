"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { formatEvmAddress } from "./format";

type WalletUiContextValue = {
  isOpen: boolean;
  evmAddress: string | null;
  evmLabel: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  connectEvm: () => void;
  disconnectEvm: () => void;
};

const WalletUiContext = createContext<WalletUiContextValue | null>(null);

type WalletUiProviderProps = PropsWithChildren<{
  initialOpen?: boolean;
}>;

function subscribeToHydration() {
  return () => undefined;
}

function useHasHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export function WalletUiProvider({
  children,
  initialOpen = false,
}: WalletUiProviderProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const hasHydrated = useHasHydrated();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const evmAddress = hasHydrated && isConnected ? address ?? null : null;

  const value: WalletUiContextValue = {
    isOpen,
    evmAddress,
    evmLabel: formatEvmAddress(evmAddress),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((current) => !current),
    connectEvm: () => {
      const connector =
        connectors.find((item) => item.type === "injected") ?? connectors[0];

      if (connector) {
        connect({ connector });
      }
    },
    disconnectEvm: () => disconnect(),
  };

  return (
    <WalletUiContext.Provider value={value}>
      {children}
    </WalletUiContext.Provider>
  );
}

export function useWalletUi() {
  const context = useContext(WalletUiContext);

  if (!context) {
    throw new Error("useWalletUi must be used within WalletUiProvider");
  }

  return context;
}
