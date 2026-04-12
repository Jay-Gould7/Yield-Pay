import type { Vault } from "@/lib/types";

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
  return (
    <div className="grid grid-cols-1 gap-px bg-white/6 md:grid-cols-2 xl:grid-cols-3">
      {vaults.map((vault) => (
        <VaultCard
          key={vault.id}
          vault={vault}
          onSelect={onSelect}
          dimmed={selectedVaultId !== null && selectedVaultId !== vault.id}
          selected={selectedVaultId === vault.id}
        />
      ))}
    </div>
  );
}
