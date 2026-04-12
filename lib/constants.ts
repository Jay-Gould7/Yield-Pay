import { ChainId } from '@lifi/sdk'

// Supported Chains - using LI.FI ChainId enum
// These are the chains supported by our wagmi config
export const CHAINS = {
  ETHEREUM: ChainId.ETH,
  POLYGON: ChainId.POL,
  ARBITRUM: ChainId.ARB,
  OPTIMISM: ChainId.OPT,
  BASE: ChainId.BAS,
  ARBITRUM_NOVA: ChainId.ARN,
  AVALANCHE: ChainId.AVA,
  BSC: ChainId.BSC,
  CELO: ChainId.CEL,
  CRONOS: ChainId.CRO,
  FANTOM: ChainId.FTM,
  FUSE: ChainId.FUS,
  // Note: ChainId.DAI refers to Gnosis Chain in LI.FI SDK (not the DAI token)
  GNOSIS: ChainId.DAI,
  LINEA: ChainId.LNA,
  MANTLE: ChainId.MNT,
  METIS: ChainId.MAM,
  MOONBEAM: ChainId.MOO,
  MOONRIVER: ChainId.MOR,
  ZKSYNC: ChainId.ERA,
  SCROLL: ChainId.SCL,
  BLAST: ChainId.BLS,
  MODE: ChainId.MOD,
  BERACHAIN: ChainId.BER,
  SONIC: ChainId.SON,
  UNICHAIN: ChainId.UNI,
  FRAXTAL: ChainId.FRA,
  IMMUTABLE_ZKEVM: ChainId.IMX,
  BOBA: ChainId.BOB,
  AURORA: ChainId.AUR,
  XDC: ChainId.XDC,
  FLARE: ChainId.FLR,
  TELOS: ChainId.TLO,
  VICTION: ChainId.VIC,
  TAIKO: ChainId.TAI,
  ABSTRACT: ChainId.ABS,
  ETHERLINK: ChainId.ETL,
  EVMOS: ChainId.EVM,
  GRAVITY: ChainId.GRA,
  HEMI: ChainId.HMI,
  HYPER_EVM: ChainId.HYP,
  INK: ChainId.INK,
  KLAYTN: ChainId.KAI,
  LENS: ChainId.LNS,
  LISK: ChainId.LSK,
  MEGAETH: ChainId.MEG,
  MONAD: ChainId.MON,
  MORPH: ChainId.MOP,
  OPBNB: ChainId.OPB,
  PLUME: ChainId.PLU,
  POLYGON_ZKEVM: ChainId.PZE,
  ROOTSTOCK: ChainId.RSK,
  SUPERPOSITION: ChainId.SUP,
  SWELLCHAIN: ChainId.SWL,
  VANA: ChainId.VAN,
  VELAS: ChainId.VEL,
  WORLDCHAIN: ChainId.WCC,
  XLAYER: ChainId.XLY,
} as const

export type ChainIdType = (typeof CHAINS)[keyof typeof CHAINS]

// Common Token Addresses (by chain)
export const TOKENS = {
  // Ethereum
  ETH: '0x0000000000000000000000000000000000000000',
  USDC_ETH: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT_ETH: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',

  // Polygon
  USDC_POL: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  USDT_POL: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  MATIC: '0x0000000000000000000000000000000000000000',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',

  // Base
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH_BASE: '0x4200000000000000000000000000000000000006',

  // Arbitrum
  USDC_ARB: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  USDT_ARB: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',

  // Optimism
  USDC_OP: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff05',
  USDT_OP: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',

  // BSC
  USDC_BSC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  USDT_BSC: '0x55d398326f99059fF775485246999027B3197955',
  BNB: '0x0000000000000000000000000000000000000000',

  // Avalanche
  USDC_AVAX: '0xB97EF9ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  USDT_AVAX: '0x9702230A8Ea53601f5cD5b5FB0F4545f3E20Fb9D',
  AVAX: '0x0000000000000000000000000000000000000000',

  // Linea
  USDC_LINEA: '0x176211869cA2b568f2a7D4EE941E073a821EE1ff',
  ETH_LINEA: '0x0000000000000000000000000000000000000000',
} as const

// Vault Token Addresses (Target for deposits)
// TODO: Verify vault addresses against official protocol documentation in Phase 2
export const VAULTS = {
  // Morpho on Base
  MORPHO_BASE_USDC: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',

  // EtherFi on Ethereum
  ETHERFI_ETH: '0xFe0e94b57F5D8D5D9AeFcFd5E2b8d49a2bE66014',

  // Additional vaults can be added here
} as const

// Vault Metadata
export interface VaultInfo {
  name: string
  protocol: string
  chainId: ChainId
  vaultToken: string
  underlyingToken: string
  apy: number // Base APY percentage - TODO: Fetch from LI.FI API in Phase 2
  description: string
}

export const VAULT_LIST: VaultInfo[] = [
  {
    name: 'Morpho USDC',
    protocol: 'Morpho',
    chainId: CHAINS.BASE,
    vaultToken: VAULTS.MORPHO_BASE_USDC,
    underlyingToken: TOKENS.USDC_BASE,
    apy: 15.2, // TODO: Fetch from LI.FI API in Phase 2
    description: 'Morpho USDC Lending Vault on Base',
  },
  {
    name: 'EtherFi ETH',
    protocol: 'EtherFi',
    chainId: CHAINS.ETHEREUM,
    vaultToken: VAULTS.ETHERFI_ETH,
    underlyingToken: TOKENS.ETH,
    apy: 4.8, // TODO: Fetch from LI.FI API in Phase 2
    description: 'EtherFi liquid staking on Ethereum',
  },
]

// API Endpoints
export const LI_FI_API = {
  QUOTE_URL: 'https://li.quest/v1/quote',
  GET_STATUS_URL: 'https://li.quest/v1/status',
} as const

// Calculation Constants
export const CALCULATION = {
  DAYS_PER_YEAR: 365,
  HOURS_PER_DAY: 24,
  SECONDS_PER_HOUR: 3600,
} as const

// UI Constants
export const UI = {
  BREAK_EVEN_HIGHLIGHT_THRESHOLD_HOURS: 48,
  MAX_SLIPPAGE: 0.03, // 3%
  DEFAULT_SLIPPAGE: 0.005, // 0.5%
} as const
