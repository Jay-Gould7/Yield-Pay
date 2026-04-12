"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowRightLeft, LayoutGrid } from "lucide-react";

import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/routes", label: "Routes", icon: ArrowRightLeft },
  { href: "/trade", label: "Trade", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-white/10 bg-[#161616] lg:flex lg:flex-col">
      <div className="border-b border-white/5 p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.08em] text-[var(--color-accent)]">
          YIELD_PAY
        </h1>
        <p className="mt-1 font-mono text-[10px] tracking-[0.28em] text-zinc-500">
          TECHNICAL_AUTOPSY_V1
        </p>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 border-l-4 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "border-[var(--color-accent)] bg-white/5 text-[var(--color-accent)]"
                      : "border-transparent text-zinc-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/5 p-6">
        <ConnectWalletButton />
      </div>
    </aside>
  );
}
