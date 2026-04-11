type WalletSummaryInput = {
  evmAddress?: string | null;
  solanaAddress?: string | null;
};

function shorten(value: string, start: number, end: number) {
  if (value.length <= start + end) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function formatEvmAddress(address?: string | null) {
  return address ? shorten(address, 6, 4) : null;
}

export function formatSolanaAddress(address?: string | null) {
  return address ? shorten(address, 4, 4) : null;
}

export function formatWalletSummary({
  evmAddress,
  solanaAddress,
}: WalletSummaryInput) {
  if (evmAddress && solanaAddress) {
    return "EVM+SOL";
  }

  if (evmAddress) {
    return `EVM ${formatEvmAddress(evmAddress)}`;
  }

  if (solanaAddress) {
    return `SOL ${formatSolanaAddress(solanaAddress)}`;
  }

  return "Connect_Wallet";
}
