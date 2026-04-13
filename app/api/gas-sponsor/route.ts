import { NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, formatEther, http, isAddress } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  linea,
  mainnet,
  optimism,
  polygon,
  type Chain,
} from "viem/chains";

import {
  computeSponsorTopUpWei,
  DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI,
  DEFAULT_GAS_SPONSOR_TARGET_BALANCE_WEI,
  parseOptionalWei,
} from "@/lib/gas-sponsor";

const SUPPORTED_SPONSOR_CHAINS: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [base.id]: base,
  [avalanche.id]: avalanche,
  [bsc.id]: bsc,
  [linea.id]: linea,
};

type SponsorRequest = {
  chainId?: number;
  minBalanceWei?: string;
  recipient?: string;
  targetBalanceWei?: string;
};

function resolveChain(chainId?: number | null) {
  if (!chainId) {
    return SUPPORTED_SPONSOR_CHAINS[mainnet.id];
  }

  return SUPPORTED_SPONSOR_CHAINS[chainId];
}

function resolveSponsorConfig() {
  const privateKey = process.env.GAS_SPONSOR_PRIVATE_KEY as `0x${string}` | undefined;

  if (!privateKey) {
    return null;
  }

  const account = privateKeyToAccount(privateKey);
  const transport = http(process.env.GAS_SPONSOR_RPC_URL || undefined, {
    timeout: 12_000,
  });

  return {
    account,
    transport,
  };
}

export async function GET(request: Request) {
  const config = resolveSponsorConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Gas sponsor is not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const chainParam = url.searchParams.get("chainId");
  const chainId = chainParam ? Number.parseInt(chainParam, 10) : mainnet.id;
  const chain = resolveChain(chainId);

  if (!chain) {
    return NextResponse.json(
      { error: `Chain ${chainId} is not enabled for gas sponsor.` },
      { status: 400 },
    );
  }

  try {
    const publicClient = createPublicClient({
      chain,
      transport: config.transport,
    });
    const balanceWei = await publicClient.getBalance({
      address: config.account.address,
    });

    return NextResponse.json({
      address: config.account.address,
      balanceEth: formatEther(balanceWei),
      balanceWei: balanceWei.toString(),
      chainId: chain.id,
      chainName: chain.name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read sponsor balance.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const config = resolveSponsorConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Gas sponsor is not configured." },
      { status: 503 },
    );
  }

  let body: SponsorRequest;
  try {
    body = (await request.json()) as SponsorRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.chainId || !body.recipient || !isAddress(body.recipient)) {
    return NextResponse.json(
      { error: "chainId and a valid recipient are required." },
      { status: 400 },
    );
  }

  const chain = resolveChain(body.chainId);
  if (!chain) {
    return NextResponse.json(
      { error: `Chain ${body.chainId} is not enabled for gas sponsor.` },
      { status: 400 },
    );
  }

  const minBalanceWei = parseOptionalWei(
    body.minBalanceWei,
    DEFAULT_GAS_SPONSOR_MIN_BALANCE_WEI,
  );
  const targetBalanceWei = parseOptionalWei(
    body.targetBalanceWei,
    DEFAULT_GAS_SPONSOR_TARGET_BALANCE_WEI,
  );

  try {
    const publicClient = createPublicClient({ chain, transport: config.transport });
    const walletClient = createWalletClient({
      account: config.account,
      chain,
      transport: config.transport,
    });
    const recipient = body.recipient as `0x${string}`;

    const currentBalanceWei = await publicClient.getBalance({ address: recipient });
    const topUpWei = computeSponsorTopUpWei({
      currentBalanceWei,
      minBalanceWei,
      targetBalanceWei,
    });

    if (topUpWei === 0n) {
      return NextResponse.json({
        currentBalanceWei: currentBalanceWei.toString(),
        sponsored: false,
        topUpWei: "0",
      });
    }

    const sponsorBalanceWei = await publicClient.getBalance({ address: config.account.address });
    if (sponsorBalanceWei <= topUpWei) {
      return NextResponse.json(
        {
          error: "Sponsor wallet balance is insufficient.",
          requiredWei: topUpWei.toString(),
          sponsorBalanceWei: sponsorBalanceWei.toString(),
        },
        { status: 503 },
      );
    }

    const txHash = await walletClient.sendTransaction({
      account: config.account,
      chain,
      to: recipient,
      value: topUpWei,
    });

    return NextResponse.json({
      chainId: chain.id,
      currentBalanceWei: currentBalanceWei.toString(),
      sponsored: true,
      topUpWei: topUpWei.toString(),
      txHash,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gas sponsorship failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
