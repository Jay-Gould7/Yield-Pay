import type { PropsWithChildren } from "react";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 lg:pl-64">
          <Topbar />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
