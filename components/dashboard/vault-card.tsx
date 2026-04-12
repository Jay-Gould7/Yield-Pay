"use client";

import type { MouseEvent } from "react";

import type { Vault } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";

type VaultCardProps = {
  vault: Vault;
  dimmed?: boolean;
  selected?: boolean;
  onSelect: (vault: Vault, rect: DOMRect) => void;
};

export function VaultCard({
  vault,
  dimmed = false,
  selected = false,
  onSelect,
}: VaultCardProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onSelect(vault, event.currentTarget.getBoundingClientRect());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group panel-frame relative flex w-full flex-col bg-[var(--color-panel)] p-6 text-left transition duration-300 hover:bg-[var(--color-panel-2)] ${
        dimmed ? "opacity-25" : "opacity-100"
      } ${selected ? "ring-1 ring-[var(--color-accent)]" : ""}`}
    >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-[28px] font-bold tracking-[-0.06em] text-white">
            {vault.name}
          </h3>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {vault.protocol} / {vault.network}
          </p>
        </div>
        <StatusBadge label={vault.status} tone={vault.statusTone} />
      </div>

      <div className="grid grid-cols-2 gap-y-6">
        <Metric label="APY" value={vault.apy} />
        <Metric align="right" label="Est. Gas" value={vault.estGas} />
        <Metric label="Daily Yield" value={vault.dailyYield} />
        <Metric align="right" label="Risk Tier" value={vault.riskTier} />
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-zinc-500">Break-Even Velocity</span>
          <span className="text-[var(--color-accent)]">{vault.breakEven}</span>
        </div>
        <div className="h-1 bg-white/8">
          <div
            className="glow-line h-full bg-[var(--color-accent)]"
            style={{ width: vault.breakEvenWidth }}
          />
        </div>
      </div>
    </button>
  );
}

type MetricProps = {
  label: string;
  value: string;
  align?: "left" | "right";
};

function Metric({ label, value, align = "left" }: MetricProps) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-[28px] font-medium tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
