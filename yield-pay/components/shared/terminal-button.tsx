import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type TerminalButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
  }
>;

export function TerminalButton({
  children,
  className = "",
  variant = "primary",
  ...props
}: TerminalButtonProps) {
  const base =
    "inline-flex items-center justify-center border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.24em] transition duration-200";
  const tone =
    variant === "primary"
      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[#032616] hover:brightness-110"
      : "border-white/10 bg-white/0 text-[var(--color-text-dim)] hover:bg-white/5 hover:text-white";

  return (
    <button className={`${base} ${tone} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
