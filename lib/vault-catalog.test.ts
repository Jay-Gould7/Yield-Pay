import { describe, expect, it } from "vitest";

import { buildVaultCatalog, type EarnVaultCatalogEntry } from "./vault-catalog";

describe("buildVaultCatalog", () => {
  it("interprets LI.FI Earn APY totals as percentages", () => {
    const entries: EarnVaultCatalogEntry[] = [
      {
        address: "0x9b5e92fd227876b4c07a8c02367e2cb23c639dfa",
        analytics: {
          apy: { total: 3713.74813 },
          tvl: { usd: "1071351" },
        },
        asset: "USDC",
        chainId: 1,
        isTransactional: true,
        name: "CSYUSDC",
        protocol: { name: "morpho-v1" },
      },
    ];

    const [vault] = buildVaultCatalog(entries);

    expect(vault?.apy).toBe("3713.75%");
  });
});
