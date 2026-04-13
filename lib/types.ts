export type Vault = {
  id: string;
  name: string;
  protocol: string;
  network: string;
  category?: "recommend" | "lending" | "vaults" | "liquid-staking" | "yield" | "staking";
  targetAsset?: string;
  targetChainId?: number;
  vaultAddress?: string;
  apy: string;
  estGas: string;
  dailyYield: string;
  riskTier: string;
  breakEven: string;
  breakEvenWidth: string;
  status: string;
  statusTone: "accent" | "muted";
  summary: string;
  analysisTitle: string;
  confidence: string;
  netApr: string;
  overheadUsd: string;
};

export type RouteCandidate = {
  id: string;
  label: string;
  chain: string;
  latency: string;
  cost: string;
  confidence: string;
  delta: string;
  path: string;
};

export type ExecutionLine = {
  id: string;
  tone: "muted" | "accent" | "success";
  text: string;
};
