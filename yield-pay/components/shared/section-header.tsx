type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  detail?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  detail,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
          {title}
        </h2>
      </div>
      {detail ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-dim)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
