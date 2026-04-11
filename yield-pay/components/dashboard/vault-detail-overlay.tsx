"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TerminalButton } from "@/components/shared/terminal-button";
import type { Vault } from "@/lib/types";

type VaultDetailOverlayProps = {
  vault: Vault | null;
  originRect: DOMRect | null;
  onClose: () => void;
};

type Viewport = {
  width: number;
  height: number;
};

function getViewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

export function VaultDetailOverlay({
  vault,
  originRect,
  onClose,
}: VaultDetailOverlayProps) {
  const router = useRouter();
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    if (!vault) {
      return;
    }

    const update = () => setViewport(getViewport());
    update();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("resize", update);
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [vault, onClose]);

  const target = useMemo(() => {
    if (!viewport) {
      return null;
    }

    const width = Math.min(viewport.width - 32, 1100);
    const height = Math.min(viewport.height - 48, 720);
    const x = (viewport.width - width) / 2;
    const y = Math.max(24, (viewport.height - height) / 2);

    return { width, height, x, y };
  }, [viewport]);

  const initial =
    vault && originRect
      ? {
          x: originRect.left,
          y: originRect.top,
          width: originRect.width,
          height: originRect.height,
        }
      : null;

  return (
    <AnimatePresence>
      {vault && target && initial ? (
        <motion.div
          className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="panel-frame technical-grid absolute overflow-hidden bg-[var(--color-panel)] shadow-2xl"
            initial={initial}
            animate={target}
            exit={initial}
            transition={{ type: "spring", stiffness: 230, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid h-full grid-cols-1 xl:grid-cols-[1.4fr_0.9fr]">
              <section className="flex min-h-0 flex-col justify-between border-b border-white/8 p-6 xl:border-b-0 xl:border-r xl:p-10">
                <div>
                  <div className="mb-12 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-accent)]">
                        Vault Analysis
                      </p>
                      <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.06em] text-white md:text-5xl">
                        {vault.name}
                      </h2>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        {vault.protocol} / {vault.network}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close vault detail"
                      className="grid size-10 place-items-center border border-white/10 bg-white/5 text-zinc-400 transition hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="panel-frame relative overflow-hidden bg-[var(--color-bg-elevated)] p-6 md:p-8">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/50 to-transparent" />
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                            Yield vs Gas Amortization
                          </p>
                          <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white">
                            {vault.analysisTitle}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                            24H Proj.
                          </p>
                          <p className="mt-2 font-mono text-xl text-[var(--color-accent)]">
                            {vault.netApr}
                          </p>
                        </div>
                      </div>

                      <div className="relative min-h-[240px] border-l border-b border-white/10 pl-2">
                        <svg
                          className="h-[220px] w-full"
                          viewBox="0 0 800 260"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <line
                            x1="0"
                            x2="800"
                            y1="170"
                            y2="170"
                            stroke="rgba(255,90,103,0.8)"
                            strokeDasharray="8 8"
                            strokeWidth="2"
                          />
                          <path
                            d="M0 220 L150 180 L300 155 L430 110 L560 72 L700 36 L800 16"
                            stroke="var(--color-accent)"
                            strokeWidth="3"
                          />
                          <path
                            d="M0 220 L150 180 L300 155 L430 110 L560 72 L700 36 L800 16 L800 260 L0 260 Z"
                            fill="url(#yieldFill)"
                          />
                          <line
                            x1="430"
                            x2="430"
                            y1="0"
                            y2="240"
                            stroke="rgba(255,255,255,0.16)"
                            strokeDasharray="6 8"
                          />
                          <circle
                            cx="430"
                            cy="110"
                            r="6"
                            fill="var(--color-accent)"
                          />
                          <defs>
                            <linearGradient
                              id="yieldFill"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="260"
                            >
                              <stop
                                offset="0%"
                                stopColor="rgba(0,255,157,0.18)"
                              />
                              <stop
                                offset="100%"
                                stopColor="rgba(0,255,157,0)"
                              />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="mt-4 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                          <span>T=0</span>
                          <span>12H</span>
                          <span>24H</span>
                          <span>36H</span>
                          <span>48H</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Stats label="Amortization Period" value={vault.breakEven} />
                  <Stats label="Cost Recovery Confidence" value={vault.confidence} />
                  <Stats label="Net APR (Post-Gas)" value={vault.netApr} />
                </div>
              </section>

              <section className="flex min-h-0 flex-col bg-[#161616] p-6 md:p-8">
                <div className="mb-8">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-accent)]">
                    Ledger Verification
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
                    Operational Costs
                  </h3>
                </div>

                <div className="space-y-6">
                  <LedgerRow
                    label="Base Fee (L1)"
                    value={vault.estGas}
                    note="Calculated against current congestion and routing depth."
                    width="33%"
                  />
                  <LedgerRow
                    label="Priority Fee"
                    value="$12.00"
                    note="Tuned for inclusion within the next two blocks."
                    width="48%"
                  />
                  <LedgerRow
                    label="Slippage Tolerance"
                    value="-$6.20"
                    note="Dynamic buffer for 0.5% liquidity variance."
                    width="24%"
                    danger
                  />
                </div>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.2em] text-zinc-500">
                      Total Overhead
                    </span>
                    <span className="font-mono text-2xl text-white">
                      {vault.overheadUsd}
                    </span>
                  </div>
                </div>

                <div className="mt-8 panel-frame border-l-2 border-l-[var(--color-danger)] bg-[var(--color-panel-2)] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white">
                    Volatile Market Risk
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    {vault.summary}
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <TerminalButton
                    className="w-full gap-3 py-4"
                    onClick={() => router.push(`/trade?vault=${vault.id}`)}
                  >
                    Execute Strategy
                    <ArrowRight className="size-4" />
                  </TerminalButton>
                  <TerminalButton className="mt-3 w-full py-4" variant="secondary">
                    Save Simulation
                  </TerminalButton>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type StatsProps = {
  label: string;
  value: string;
};

function Stats({ label, value }: StatsProps) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
    </div>
  );
}

type LedgerRowProps = {
  label: string;
  value: string;
  note: string;
  width: string;
  danger?: boolean;
};

function LedgerRow({
  label,
  value,
  note,
  width,
  danger = false,
}: LedgerRowProps) {
  return (
    <div className="group">
      <div className="mb-2 flex items-end justify-between gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
          {label}
        </span>
        <span
          className={`font-mono text-base ${
            danger ? "text-[var(--color-danger)]" : "text-white"
          }`}
        >
          {value}
        </span>
      </div>
      <div className="h-px bg-white/6">
        <div
          className={`h-px transition-all group-hover:brightness-125 ${
            danger ? "bg-[var(--color-danger)]" : "bg-[var(--color-accent)]"
          }`}
          style={{ width }}
        />
      </div>
      <p className="mt-2 text-xs leading-6 text-zinc-600">{note}</p>
    </div>
  );
}
