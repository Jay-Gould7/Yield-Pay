import { ArrowUpRight, GitBranch } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { routeCandidates } from "@/lib/mock-data";

export function RoutesScreen() {
  return (
    <div className="px-4 py-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1400px] space-y-10">
        <SectionHeader
          eyebrow="Route Engine"
          title="Execution Path Matrix"
          detail="Latency / Cost / Confidence"
        />

        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.8fr]">
          <section className="space-y-4">
            {routeCandidates.map((candidate, index) => (
              <article
                key={candidate.id}
                className="panel-frame grid gap-6 bg-[var(--color-panel)] p-6 md:grid-cols-[0.9fr_1.2fr_auto]"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    Candidate_{String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                    {candidate.label}
                  </h3>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                    {candidate.chain}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <RouteMetric label="Latency" value={candidate.latency} />
                  <RouteMetric label="Cost" value={candidate.cost} />
                  <RouteMetric label="Confidence" value={candidate.confidence} />
                  <RouteMetric label="Yield Delta" value={candidate.delta} />
                </div>

                <div className="flex flex-col items-start gap-4 md:items-end">
                  <StatusBadge
                    label={index === 0 ? "Primary" : "Candidate"}
                    tone={index === 0 ? "accent" : "muted"}
                  />
                  <p className="max-w-52 text-sm leading-7 text-zinc-400 md:text-right">
                    {candidate.path}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <aside className="panel-frame flex flex-col justify-between bg-[var(--color-bg-elevated)] p-6 md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <GitBranch className="size-5 text-[var(--color-accent)]" />
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  Route Insight
                </p>
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                Favor Arbitrum, reserve Solana for high-velocity bursts.
              </h3>
              <p className="mt-5 text-base leading-8 text-zinc-400">
                Current conditions make Arbitrum the cleanest execution venue for
                stable routing, while Solana remains the highest-throughput branch for
                rapid rebalance windows when confidence thresholds are met.
              </p>
            </div>

            <div className="mt-10 border-t border-white/8 pt-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <span>Recommended</span>
                <span className="text-[var(--color-accent)]">Arbitrum Fast Path</span>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm text-white">
                <ArrowUpRight className="size-4 text-[var(--color-accent)]" />
                <span>Projected execution confidence remains above 98%.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

type RouteMetricProps = {
  label: string;
  value: string;
};

function RouteMetric({ label, value }: RouteMetricProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
