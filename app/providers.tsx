"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { StrictMode, useState, useSyncExternalStore } from "react";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";

import { WalletUiProvider } from "@/lib/wallet/ui-context";

import { config } from "./config/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 5,
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

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

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const hasHydrated = useHasHydrated();

  return (
    <StrictMode>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          {hasHydrated ? (
            <RainbowKitProvider
              initialChain={base}
              theme={darkTheme({
                accentColor: "#00ff9d",
                accentColorForeground: "#032616",
                borderRadius: "small",
              })}
            >
              <WalletUiProvider>{children}</WalletUiProvider>
            </RainbowKitProvider>
          ) : (
            <WalletUiProvider>{children}</WalletUiProvider>
          )}
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  );
}
