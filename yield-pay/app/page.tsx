import { HomeScreen } from "@/components/home/home-screen";
import { AppShell } from "@/components/layout/app-shell";

type HomePageProps = {
  searchParams: Promise<{
    compare?: string;
    execute?: string;
    vault?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <AppShell>
      <HomeScreen
        initialCompareOpen={params.compare === "1"}
        initialVaultId={params.vault}
        initialExecutionOpen={params.execute === "1"}
      />
    </AppShell>
  );
}
