import { useMemo, useState } from "react";

import type { Vault } from "@/lib/types";
import {
  classifyVaultCategory,
  type VaultCategory,
} from "@/lib/vault-catalog";

import { VaultCard } from "./vault-card";

type VaultGridProps = {
  vaults: Vault[];
  selectedVaultId: string | null;
  onSelect: (vault: Vault, rect: DOMRect) => void;
};

export function VaultGrid({
  vaults,
  selectedVaultId,
  onSelect,
}: VaultGridProps) {
  const [activeCategory, setActiveCategory] = useState<VaultCategory>("recommend");
  const availableCategories = useMemo(() => getAvailableCategories(vaults), [vaults]);
  const visibleCategory = availableCategories.includes(activeCategory)
    ? activeCategory
    : "recommend";
  const visibleVaults = useMemo(
    () =>
      visibleCategory === "recommend"
        ? vaults.slice(0, 6)
        : vaults.filter((vault) => getVaultCategory(vault) === visibleCategory),
    [visibleCategory, vaults],
  );

  return (
    <div className="space-y-px">
      <div className="flex flex-wrap gap-px bg-white/6">
        {availableCategories.map((category) => (
          <button
            key={category}
            className={`panel-frame bg-[var(--color-panel)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] transition hover:bg-[var(--color-panel-2)] ${
              visibleCategory === category
                ? "text-[var(--color-accent)]"
                : "text-zinc-500"
            }`}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/6 md:grid-cols-2 xl:grid-cols-3">
        {visibleVaults.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            onSelect={onSelect}
            dimmed={selectedVaultId !== null && selectedVaultId !== vault.id}
            selected={selectedVaultId === vault.id}
          />
        ))}
      </div>
    </div>
  );
}

const categoryLabels: Record<VaultCategory, string> = {
  "liquid-staking": "Liquid Staking",
  lending: "Lending",
  recommend: "Recommend",
  staking: "Staking",
  vaults: "Vaults",
  yield: "Yield",
};

const categoryOrder: VaultCategory[] = [
  "recommend",
  "lending",
  "vaults",
  "liquid-staking",
  "yield",
  "staking",
];

function getAvailableCategories(vaults: Vault[]) {
  const categories = new Set<VaultCategory>();

  for (const vault of vaults) {
    categories.add(getVaultCategory(vault));
  }

  return categoryOrder.filter(
    (category) => category === "recommend" || categories.has(category),
  );
}

function getVaultCategory(vault: Vault) {
  return vault.category ?? classifyVaultCategory(vault.protocol);
}
