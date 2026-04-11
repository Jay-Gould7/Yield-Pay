import type { PropsWithChildren } from "react";

import { Topbar } from "./topbar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Topbar />
      <main>{children}</main>
    </div>
  );
}
