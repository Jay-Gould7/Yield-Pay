import { CHAINS, TOKENS } from "@/lib/constants";
import type { Address } from "viem";

export type SourceChainId =
  | "base"
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "bsc"
  | "avalanche";
export type SourceTokenId = "usdc" | "native";
export type SourceTokenSymbol = "USDC" | "ETH" | "MATIC" | "BNB" | "AVAX";

export type SourceChainOption = {
  id: SourceChainId;
  chainId: number;
  label: string;
  costMultiplier: number;
  nativeSymbol: Exclude<SourceTokenSymbol, "USDC">;
  routeNote: string;
};

export type SourceTokenOption = {
  id: SourceTokenId;
  address: Address;
  decimals: number;
  isNative: boolean;
  label: string;
  costMultiplier: number;
  symbol: SourceTokenSymbol;
};

export type HomeVaultOption = {
  id: string;
  name: string;
  protocol: string;
  network: string;
  apy: number;
  risk: "Low" | "Medium" | "Elevated";
  baseCost: number;
  confidence: number;
  reason: string;
  routePlan: string;
};

export const sourceChains: SourceChainOption[] = [
  {
    id: "base",
    chainId: CHAINS.BASE,
    label: "Base",
    costMultiplier: 1,
    nativeSymbol: "ETH",
    routeNote: "Shortest route to the Base vault set with low execution overhead.",
  },
  {
    id: "ethereum",
    chainId: CHAINS.ETHEREUM,
    label: "Ethereum",
    costMultiplier: 1.45,
    nativeSymbol: "ETH",
    routeNote: "Highest liquidity source chain, usually with the highest gas cost.",
  },
  {
    id: "arbitrum",
    chainId: CHAINS.ARBITRUM,
    label: "Arbitrum",
    costMultiplier: 1.12,
    nativeSymbol: "ETH",
    routeNote: "Low-cost ETH-native routing into the Base vault destination.",
  },
  {
    id: "optimism",
    chainId: CHAINS.OPTIMISM,
    label: "Optimism",
    costMultiplier: 1.1,
    nativeSymbol: "ETH",
    routeNote: "Another low-friction ETH-native source chain for Base-bound deposits.",
  },
  {
    id: "polygon",
    chainId: CHAINS.POLYGON,
    label: "Polygon",
    costMultiplier: 1.08,
    nativeSymbol: "MATIC",
    routeNote: "Cheap USDC and MATIC entry point when you want lower starting costs.",
  },
  {
    id: "bsc",
    chainId: CHAINS.BSC,
    label: "BSC",
    costMultiplier: 1.18,
    nativeSymbol: "BNB",
    routeNote: "Broad retail liquidity with slightly higher route variance into Base.",
  },
  {
    id: "avalanche",
    chainId: CHAINS.AVALANCHE,
    label: "Avalanche",
    costMultiplier: 1.16,
    nativeSymbol: "AVAX",
    routeNote: "Fast finality source chain with Base as the fixed destination vault layer.",
  },
];

const usdcAddressesByChainId: Record<SourceChainId, Address> = {
  avalanche: TOKENS.USDC_AVAX as Address,
  arbitrum: TOKENS.USDC_ARB as Address,
  base: TOKENS.USDC_BASE as Address,
  bsc: TOKENS.USDC_BSC as Address,
  ethereum: TOKENS.USDC_ETH as Address,
  optimism: TOKENS.USDC_OP as Address,
  polygon: TOKENS.USDC_POL as Address,
};

export function getSourceChainOption(id: SourceChainId) {
  return sourceChains.find((chain) => chain.id === id);
}

export function getSourceTokenOptions(chain: SourceChainOption): SourceTokenOption[] {
  return [
    {
      id: "usdc",
      address: usdcAddressesByChainId[chain.id],
      decimals: 6,
      isNative: false,
      label: "USDC",
      costMultiplier: 1,
      symbol: "USDC",
    },
    {
      id: "native",
      address: TOKENS.ETH as Address,
      decimals: 18,
      isNative: true,
      label: chain.nativeSymbol,
      costMultiplier: 1.28,
      symbol: chain.nativeSymbol,
    },
  ];
}

export const homeVaults: HomeVaultOption[] = [
  {
    id: "aave-usdc-base",
    name: "Aave USDC",
    protocol: "Aave",
    network: "Base",
    apy: 8.4,
    risk: "Low",
    baseCost: 1.6,
    confidence: 96,
    reason: "Clean default for a stable low-friction demo path on Base.",
    routePlan: "Swap or bridge into Base USDC, then deposit into Aave on Base.",
  },
  {
    id: "morpho-usdc-base",
    name: "Morpho USDC",
    protocol: "Morpho",
    network: "Base",
    apy: 15.2,
    risk: "Low",
    baseCost: 1.45,
    confidence: 97,
    reason: "Fast recovery on a low-cost chain makes this the strongest default for stablecoin capital.",
    routePlan: "Bridge to Base, swap if needed, then deposit into Morpho USDC.",
  },
  {
    id: "moonwell-usdc-base",
    name: "Moonwell USDC",
    protocol: "Moonwell",
    network: "Base",
    apy: 9.9,
    risk: "Low",
    baseCost: 1.5,
    confidence: 94,
    reason: "Simple Base-native lending route with a stable payoff profile.",
    routePlan: "Keep capital on Base and route directly into Moonwell's USDC vault.",
  },
  {
    id: "seamless-usdc-base",
    name: "Seamless USDC",
    protocol: "Seamless",
    network: "Base",
    apy: 7.6,
    risk: "Low",
    baseCost: 1.35,
    confidence: 92,
    reason: "Another low-complexity Base candidate when you want fast onboarding over maximal APY.",
    routePlan: "Route to Base and deposit into Seamless with minimal extra path complexity.",
  },
  {
    id: "compound-usdc-base",
    name: "Compound USDC",
    protocol: "Compound",
    network: "Base",
    apy: 6.8,
    risk: "Medium",
    baseCost: 1.55,
    confidence: 91,
    reason: "Lower-yield fallback with a recognizable protocol name for demo clarity.",
    routePlan: "Deposit Base USDC into Compound after the quote finalizes.",
  },
];

export const executionPhases = [
  {
    id: "wallet",
    title: "Wallet ready",
    detail: "Connection confirmed and the Base execution flow is ready.",
  },
  {
    id: "quote",
    title: "Quote locked",
    detail: "Live route costs and the recovery window are fixed for this run.",
  },
  {
    id: "approval",
    title: "Allowance ready",
    detail: "Approval is only requested if the route spends an ERC-20 token.",
  },
  {
    id: "route",
    title: "Route submitted",
    detail: "The LI.FI transaction is moving into the destination vault flow.",
  },
  {
    id: "done",
    title: "Yield live",
    detail: "Position is active and now working to cover its own cost.",
  },
] as const;
