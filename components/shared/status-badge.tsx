type StatusBadgeProps = {
  label: string;
  tone?: "accent" | "muted";
};

export function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
  const className =
    tone === "accent"
      ? "border-[color:var(--color-accent)]/25 text-[var(--color-accent)]"
      : "border-white/10 text-zinc-500";

  return (
    <span
      className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-tight ${className}`}
    >
      {label}
    </span>
  );
}
