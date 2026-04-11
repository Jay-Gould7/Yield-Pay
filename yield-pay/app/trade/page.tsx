import { AppShell } from "@/components/layout/app-shell";
import { TradeScreen } from "@/components/trade/trade-screen";

type TradePageProps = {
  searchParams: Promise<{ vault?: string }>;
};

export default async function TradePage({ searchParams }: TradePageProps) {
  const params = await searchParams;

  return (
    <AppShell>
      <TradeScreen vaultId={params.vault} />
    </AppShell>
  );
}
