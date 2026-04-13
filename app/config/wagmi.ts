import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { base } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const BASE_RPC_URL = "https://mainnet.base.org";

// Yield-Pay currently executes and reads vault state on Base only.
const supportedChains = [base] as const;

export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      target: {
        id: 'okx',
        name: 'OKX Wallet',
        provider(window) {
          const okxProvider =
            window?.okxwallet?.ethereum ??
            window?.ethereum?.providers?.find(
              (provider) => provider?.isOkxWallet || provider?.isOKExWallet,
            ) ??
            (window?.ethereum?.isOkxWallet || window?.ethereum?.isOKExWallet
              ? window.ethereum
              : undefined)

          return okxProvider
        },
      },
    }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [base.id]: http(BASE_RPC_URL),
  },
});

export { supportedChains };

export type SupportedChainId = (typeof supportedChains)[number]["id"];
