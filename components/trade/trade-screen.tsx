import { ArrowRight, ShieldAlert } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TerminalButton } from "@/components/shared/terminal-button";
import { executionLines, getVaultById, routeCandidates } from "@/lib/mock-data";

type TradeScreenProps = {
  vaultId?: string;
};

export function TradeScreen({ vaultId }: TradeScreenProps) {
  const vault = getVaultById(vaultId);
  const primaryRoute = routeCandidates[0];

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-10">
        <SectionHeader
          eyebrow="Execution Terminal"
          title={`Executing ${vault.name}`}
          detail={`Route / ${primaryRoute.label}`}
        />

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="panel-frame overflow-hidden bg-[#141414]">
            <div className="flex items-center justify-between border-b border-white/8 bg-[#1c1c1c] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="size-2 animate-pulse bg-[var(--color-accent)]" />
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.04em] text-white">
                  Executing Deposit
                </h2>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                PID: 8842_TX_STREAM
              </p>
            </div>

            <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="min-h-[420px] border-b border-white/8 bg-[#0f0f0f] p-6 xl:border-b-0 xl:border-r">
                <div className="space-y-3 font-mono text-sm">
                  {executionLines.map((line) => (
                    <p
                      key={line.id}
                      className={
                        line.tone === "success"
                          ? "text-[var(--color-accent)]"
                          : line.tone === "accent"
                            ? "text-zinc-200"
                            : "text-zinc-600"
                      }
                    >
                      {line.text}
                    </p>
                  ))}
                  <p className="flex items-center gap-2 text-white">
                    <span className="animate-pulse text-[var(--color-accent)]">&gt;</span>
                    <span>Awaiting final bundler inclusion...</span>
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Selected Vault
                  </p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                        {vault.name}
                      </h3>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        {vault.protocol} / {vault.network}
                      </p>
                    </div>
                    <StatusBadge label={vault.status} tone={vault.statusTone} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TradeMetric label="Projected APR" value={vault.netApr} />
                  <TradeMetric label="Overhead" value={vault.overheadUsd} />
                  <TradeMetric label="Route Cost" value={primaryRoute.cost} />
                  <TradeMetric label="Confidence" value={vault.confidence} />
                </div>

                <div className="panel-frame border-l-2 border-l-[var(--color-danger)] bg-[var(--color-panel-2)] p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 size-4 text-[var(--color-danger)]" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                        Risk Notice
                      </p>
                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        Execution remains mock-driven in this phase. Wallet signing,
                        allowance changes, and live settlement are not yet connected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <TerminalButton className="w-full gap-3 py-4">
                    Confirm Execution
                    <ArrowRight className="size-4" />
                  </TerminalButton>
                  <TerminalButton className="w-full py-4" variant="secondary">
                    Abort Sequence
                  </TerminalButton>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="panel-frame bg-[var(--color-panel)] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Route Summary
              </p>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
                {primaryRoute.label}
              </h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {primaryRoute.path}
              </p>
              <div className="mt-6 space-y-3 font-mono text-[11px] uppercase tracking-[0.18em]">
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <span className="text-zinc-500">Latency</span>
                  <span className="text-white">{primaryRoute.latency}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <span className="text-zinc-500">Confidence</span>
                  <span className="text-[var(--color-accent)]">
                    {primaryRoute.confidence}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Yield Delta</span>
                  <span className="text-white">{primaryRoute.delta}</span>
                </div>
              </div>
            </div>

            <div className="panel-frame bg-[var(--color-bg-elevated)] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                Process Status
              </p>
              <div className="mt-6 flex gap-2">
                <div className="h-1 flex-1 bg-[var(--color-accent)]" />
                <div className="h-1 flex-1 bg-[var(--color-accent)]" />
                <div className="h-1 flex-1 bg-[var(--color-accent)]/30" />
                <div className="h-1 flex-1 bg-white/10" />
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
                Processing Assets
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                The terminal is simulating allowance, routing, bundling, and vault
                settlement phases to match the target execution experience.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

type TradeMetricProps = {
  label: string;
  value: string;
};

function TradeMetric({ label, value }: TradeMetricProps) {
  return (
    <div className="border border-white/8 bg-white/2 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
