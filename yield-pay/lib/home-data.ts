export type SourceChainId = "base";
export type SourceTokenId = "usdc" | "eth";

export type SourceChainOption = {
  id: SourceChainId;
  label: string;
  costMultiplier: number;
  routeNote: string;
};

export type SourceTokenOption = {
  id: SourceTokenId;
  label: string;
  costMultiplier: number;
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
    label: "Base",
    costMultiplier: 1,
    routeNote: "Base faucet flow with Base-mainnet token addresses only.",
  },
];

export const sourceTokens: SourceTokenOption[] = [
  {
    id: "usdc",
    label: "USDC",
    costMultiplier: 1,
  },
  {
    id: "eth",
    label: "ETH",
    costMultiplier: 1.28,
  },
];

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
