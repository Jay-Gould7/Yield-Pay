"use client";

import { useMemo, useRef, useState } from "react";

import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useVaultCatalog } from "@/hooks/use-vault-catalog";
import { vaults } from "@/lib/mock-data";
import type { Vault } from "@/lib/types";

import { VaultDetailOverlay } from "./vault-detail-overlay";
import { VaultGrid } from "./vault-grid";

export function DashboardScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const {
    error: vaultCatalogError,
    isLoading: isVaultCatalogLoading,
    vaults: liveVaults,
  } = useVaultCatalog(vaults);

  const selectedVault = useMemo(
    () => liveVaults.find((vault) => vault.id === selectedVaultId) ?? null,
    [liveVaults, selectedVaultId],
  );

  const handleSelect = (vault: Vault, rect: DOMRect) => {
    setSelectedVaultId(vault.id);
    setOriginRect(rect);
  };

  const handleClose = () => {
    setSelectedVaultId(null);
    setOriginRect(null);
  };

  return (
    <div ref={rootRef} className="px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-12">
        <section className="grid gap-8 xl:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-accent)]">
              Global Portfolio Velocity
            </p>
            <div>
              <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.08em] text-white sm:text-6xl xl:text-7xl">
                Break-Even: <span className="text-[var(--color-accent)]">4.2 Days</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
                Yield Pay ranks vault opportunities by recovery speed, execution
                drag, and short-window reward density so deployment decisions can
                be made like terminal operations instead of passive portfolio browsing.
              </p>
            </div>
            <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
              <HeroMetric label="Net APY" value="24.12%" />
              <HeroMetric label="Est. Daily Gain" value="+$1,402.18" />
              <HeroMetric label="Wallet Health" value="Optimal" />
            </div>
          </div>

          <div className="panel-frame relative overflow-hidden bg-[var(--color-bg-elevated)] p-6">
            <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-[var(--color-accent)]/12 blur-3xl" />
            <div className="relative">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                Auto_Rebalance_Status
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-white">
                    Active Efficiency
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-400">
                    Current strategy mix is favoring Arbitrum and Solana venues where
                    fee recovery is materially faster than mainnet.
                  </p>
                </div>
                <StatusBadge label="LIVE" tone="accent" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeader
            eyebrow="Efficiency Ranking Board"
            title="Vault Surface"
            detail={
              isVaultCatalogLoading
                ? "Loading_LI.FI_Earn / Fallback_Ready"
                : vaultCatalogError
                  ? "Fallback_Data / LI.FI_Earn_Unavailable"
                  : "LI.FI_Earn_Live / Sort_By: Velocity"
            }
          />
          <VaultGrid
            vaults={liveVaults}
            selectedVaultId={selectedVaultId}
            onSelect={handleSelect}
          />
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="panel-frame relative overflow-hidden bg-[var(--color-bg-elevated)] p-6 md:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
              Network Gas Projections
            </h3>
            <div className="mt-8 space-y-4">
              {[
                ["Ethereum_Mainnet", "22 Gwei"],
                ["Arbitrum_One", "0.1 Gwei"],
                ["Optimism_Bedrock", "0.02 Gwei"],
                ["Solana_Mainnet", "0.0001 SOL"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-end justify-between border-b border-white/8 pb-3 font-mono text-[11px] uppercase tracking-[0.18em]"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-[var(--color-accent)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-frame border-l-2 border-l-[var(--color-accent)] bg-[var(--color-panel-2)] p-6 md:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
              Yield Delta Analysis
            </h3>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400">
              Real-time analysis suggests shifting 14% of ARB-USDC liquidity into
              USDC-ETH to capture the next fee spike projected for the coming 48
              hours. Estimated efficiency gain: <span className="text-white">+$42/day</span>.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span>Report_ID: AF7-890</span>
              <span>Timestamp: 2026.04.11_14:02:11</span>
            </div>
          </div>
        </section>
      </div>

      <VaultDetailOverlay
        vault={selectedVault}
        originRect={originRect}
        onClose={handleClose}
      />
    </div>
  );
}

type HeroMetricProps = {
  label: string;
  value: string;
};

function HeroMetric({ label, value }: HeroMetricProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
