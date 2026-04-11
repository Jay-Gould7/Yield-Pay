import { redirect } from "next/navigation";

type TradePageProps = {
  searchParams: Promise<{ vault?: string }>;
};

export default async function TradePage({ searchParams }: TradePageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.vault) {
    query.set("vault", params.vault);
  }

  query.set("execute", "1");

  redirect(`/?${query.toString()}`);
}
