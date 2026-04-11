'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { StrictMode, useState } from 'react'
import { config } from './config/wagmi'

import '@rainbow-me/rainbowkit/styles.css'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // Disable retry for mutations to prevent double-execution of transactions
        retry: false,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useState to create QueryClient instance to avoid SSR hydration issues
  // and ensure consistent instance across re-renders in StrictMode
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#6366f1',
              accentColorForeground: 'white',
              borderRadius: 'medium',
            })}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>
  )
}
