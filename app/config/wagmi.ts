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
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [base.id]: http(BASE_RPC_URL),
  },
});

export { supportedChains };

export type SupportedChainId = (typeof supportedChains)[number]["id"];
