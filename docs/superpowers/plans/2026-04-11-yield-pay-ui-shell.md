# Yield Pay UI Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Tailwind-based Yield Pay UI shell with grouped pages, grouped components, a vault-card expansion overlay, and a trade-terminal flow while fixing the current install-blocking dependency conflict.

**Architecture:** Keep the App Router structure simple: server page entrypoints under `app/`, reusable UI modules under `components/`, and static mock data in `lib/`. The dashboard owns overlay state in a client component so a clicked vault card can be measured and animated into a focused analysis surface before routing into the trade page.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, TypeScript, Next fonts, mock data, existing `framer-motion` dependency for focused UI motion.

---

## File Structure

- Create: `app/dashboard/page.tsx` for the dashboard route entrypoint
- Create: `app/routes/page.tsx` for the routes analysis page
- Create: `app/trade/page.tsx` for the execution terminal page
- Modify: `app/page.tsx` to redirect to `/dashboard`
- Modify: `app/layout.tsx` to set product metadata and shared document structure
- Modify: `app/globals.css` to define the dark terminal design tokens and global base styles
- Create: `components/layout/app-shell.tsx` for the app-wide shell wrapper
- Create: `components/layout/sidebar.tsx` for persistent navigation
- Create: `components/layout/topbar.tsx` for the sticky top status area
- Create: `components/dashboard/dashboard-screen.tsx` as the main client dashboard composition root
- Create: `components/dashboard/vault-grid.tsx` for the vault grid layout
- Create: `components/dashboard/vault-card.tsx` for individual vault cards
- Create: `components/dashboard/vault-detail-overlay.tsx` for the expanding focused detail surface
- Create: `components/routes/routes-screen.tsx` for route-page composition
- Create: `components/trade/trade-screen.tsx` for trade-page composition
- Create: `components/shared/section-header.tsx` for reusable section headers
- Create: `components/shared/status-badge.tsx` for reusable state chips
- Create: `components/shared/terminal-button.tsx` for action buttons
- Create: `lib/types.ts` for vault and route mock types
- Create: `lib/mock-data.ts` for static vault, route, and execution data
- Test/Verify: `npm run lint`
- Test/Verify: `npm run build`

### Task 1: Align Dependencies For A Stable Install

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Inspect the current dependency conflict**

Run: `npm ls wagmi @rainbow-me/rainbowkit`

Expected: The command shows `wagmi@3.x` in the project while `@rainbow-me/rainbowkit@2.2.10` declares `wagmi@^2.9.0` as its peer range.

- [ ] **Step 2: Decide the minimum dependency surface for phase 1**

Use this exact target for `package.json` dependencies:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.97.0",
    "axios": "^1.15.0",
    "framer-motion": "^12.38.0",
    "lucide-react": "^1.8.0",
    "next": "16.2.3",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
}
```

Reason: wallet integration is not in scope for this phase, so remove the unused conflicting wallet packages instead of shipping a broken install.

- [ ] **Step 3: Apply the minimal dependency edit**

Update `package.json` to remove:

```json
"@rainbow-me/rainbowkit": "^2.2.10",
"viem": "^2.47.12",
"wagmi": "^3.6.1"
```

Keep the rest unchanged.

- [ ] **Step 4: Refresh the lockfile**

Run: `npm install`

Expected: install completes without `ERESOLVE` and rewrites `package-lock.json` to match the reduced dependency graph.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused wallet dependencies"
```

### Task 2: Replace Global Boilerplate With Product Styling

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run build`

Expected: build succeeds but still produces the starter UI, which means the product shell is not implemented yet.

- [ ] **Step 2: Replace root metadata and font setup**

Use this structure in `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yield Pay",
  description: "Execution-focused DeFi routing and vault analysis interface.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} dark h-full`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Replace starter global styles with terminal design tokens**

Use this structure in `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --color-bg: #131313;
  --color-bg-elevated: #1a1a1a;
  --color-panel: #181818;
  --color-panel-2: #202020;
  --color-panel-3: #262626;
  --color-text: #ece7df;
  --color-text-dim: #8d928b;
  --color-line: rgba(255, 255, 255, 0.08);
  --color-accent: #00ff9d;
  --color-accent-dim: rgba(0, 255, 157, 0.18);
  --color-danger: #ff5a67;
}

@theme inline {
  --font-sans: var(--font-body);
  --font-mono: var(--font-mono);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--color-bg);
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(0, 255, 157, 0.08), transparent 24%),
    linear-gradient(180deg, #151515 0%, #101010 100%);
  color: var(--color-text);
  font-family: var(--font-body);
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 4: Run build to verify the shell-level styling compiles**

Run: `npm run build`

Expected: PASS with no CSS syntax errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: add yield pay global shell styling"
```

### Task 3: Add Shared Mock Data And Reusable UI Primitives

**Files:**
- Create: `lib/types.ts`
- Create: `lib/mock-data.ts`
- Create: `components/shared/section-header.tsx`
- Create: `components/shared/status-badge.tsx`
- Create: `components/shared/terminal-button.tsx`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run lint`

Expected: FAIL once the new imports are added later unless the shared files exist.

- [ ] **Step 2: Define the mock types**

Use this shape in `lib/types.ts`:

```ts
export type Vault = {
  id: string;
  name: string;
  protocol: string;
  network: string;
  apy: string;
  estGas: string;
  dailyYield: string;
  riskTier: string;
  breakEven: string;
  breakEvenWidth: string;
  status: string;
  statusTone: "accent" | "muted";
  summary: string;
};

export type RouteCandidate = {
  id: string;
  label: string;
  chain: string;
  latency: string;
  cost: string;
  confidence: string;
  delta: string;
};

export type ExecutionLine = {
  id: string;
  tone: "muted" | "accent" | "success";
  text: string;
};
```

- [ ] **Step 3: Create mock content for vaults, routes, and execution logs**

Create `lib/mock-data.ts` exporting:

```ts
import type { ExecutionLine, RouteCandidate, Vault } from "./types";

export const vaults: Vault[] = [/* six vault records */];
export const routeCandidates: RouteCandidate[] = [/* three route records */];
export const executionLines: ExecutionLine[] = [/* terminal log lines */];

export function getVaultById(id: string) {
  return vaults.find((vault) => vault.id === id) ?? vaults[0];
}
```

Populate the six vault records from the approved dashboard content:

- `usdc-eth`
- `arb-usdc`
- `eth-lst`
- `wbtc-eth`
- `sol-usdc`
- `op-eth`

- [ ] **Step 4: Add minimal shared primitives**

Use these implementations:

```tsx
// components/shared/section-header.tsx
type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  detail?: string;
};

export function SectionHeader({ eyebrow, title, detail }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-[var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-white">
          {title}
        </h2>
      </div>
      {detail ? <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-dim)]">{detail}</p> : null}
    </div>
  );
}
```

```tsx
// components/shared/status-badge.tsx
type StatusBadgeProps = {
  label: string;
  tone?: "accent" | "muted";
};

export function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
  const className =
    tone === "accent"
      ? "border-[var(--color-accent)]/25 text-[var(--color-accent)]"
      : "border-white/10 text-zinc-500";

  return <span className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-tight ${className}`}>{label}</span>;
}
```

```tsx
// components/shared/terminal-button.tsx
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
```

- [ ] **Step 5: Run lint**

Run: `npm run lint`

Expected: PASS, or only unrelated warnings not caused by these files.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/mock-data.ts components/shared/section-header.tsx components/shared/status-badge.tsx components/shared/terminal-button.tsx
git commit -m "feat: add yield pay shared data and UI primitives"
```

### Task 4: Build The Shared App Shell And Root Redirect

**Files:**
- Modify: `app/page.tsx`
- Create: `components/layout/app-shell.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/topbar.tsx`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run build`

Expected: root route still renders starter content instead of redirecting to `/dashboard`.

- [ ] **Step 2: Add root redirect**

Replace `app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Build the shell components**

Implement:

```tsx
// components/layout/sidebar.tsx
import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/routes", label: "Routes" },
  { href: "/trade", label: "Trade" },
];
```

The sidebar should render a brand block, a nav list, and a `CONNECT_WALLET` button with the approved black-and-acid-green aesthetic.

```tsx
// components/layout/topbar.tsx
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#131313]/80 px-6 backdrop-blur-xl">
      {/* metrics and wallet stub */}
    </header>
  );
}
```

```tsx
// components/layout/app-shell.tsx
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
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS with the redirect compiling and no shell component type errors.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/layout/app-shell.tsx components/layout/sidebar.tsx components/layout/topbar.tsx
git commit -m "feat: add yield pay app shell"
```

### Task 5: Build The Dashboard And Expanding Vault Overlay

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `components/dashboard/dashboard-screen.tsx`
- Create: `components/dashboard/vault-grid.tsx`
- Create: `components/dashboard/vault-card.tsx`
- Create: `components/dashboard/vault-detail-overlay.tsx`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run build`

Expected: FAIL once `app/dashboard/page.tsx` imports dashboard modules that do not exist yet.

- [ ] **Step 2: Create the dashboard route entrypoint**

Use:

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardScreen />
    </AppShell>
  );
}
```

- [ ] **Step 3: Implement the client dashboard composition**

`components/dashboard/dashboard-screen.tsx` should:

- start with `"use client";`
- import `useMemo`, `useRef`, `useState`
- read `vaults` mock data
- track `selectedVaultId`
- track `originRect`
- provide a card click handler that stores the clicked vault id and its `getBoundingClientRect()` result
- render the hero, vault grid, and conditional detail overlay

- [ ] **Step 4: Implement the vault card and grid**

`VaultCard` should:

- accept a `vault`
- accept `onSelect`
- render the compact dashboard metrics from the approved reference
- expose a button-like clickable container
- use mono labels and bright green break-even bars

`VaultGrid` should:

- render a responsive 1/2/3-column layout
- map over `vaults`

- [ ] **Step 5: Implement the expanding overlay**

`VaultDetailOverlay` should:

- start with `"use client";`
- accept `vault`, `originRect`, `onClose`
- read the current viewport size on mount
- compute an initial fixed-position style from `originRect`
- animate toward a centered panel using `framer-motion`
- render break-even analysis copy, cost breakdown, risk callout, and `Execute`
- close on backdrop click and Escape

Use this route push behavior:

```tsx
const router = useRouter();
router.push(`/trade?vault=${vault.id}`);
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS and `/dashboard` compiles cleanly.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/dashboard-screen.tsx components/dashboard/vault-grid.tsx components/dashboard/vault-card.tsx components/dashboard/vault-detail-overlay.tsx
git commit -m "feat: add dashboard vault expansion flow"
```

### Task 6: Build The Routes Page

**Files:**
- Create: `app/routes/page.tsx`
- Create: `components/routes/routes-screen.tsx`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run build`

Expected: FAIL once the routes page imports a screen component that does not exist yet.

- [ ] **Step 2: Add the route page entrypoint**

Use:

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { RoutesScreen } from "@/components/routes/routes-screen";

export default function RoutesPage() {
  return (
    <AppShell>
      <RoutesScreen />
    </AppShell>
  );
}
```

- [ ] **Step 3: Implement the analytical routes screen**

`components/routes/routes-screen.tsx` should:

- render a headline with section chips
- show three route candidates from `routeCandidates`
- include a right-side or lower insight panel with confidence, gas, and rationale
- match the same typography and panel system as the dashboard

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS and `/routes` compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add app/routes/page.tsx components/routes/routes-screen.tsx
git commit -m "feat: add routes analysis page"
```

### Task 7: Build The Trade Terminal Page

**Files:**
- Create: `app/trade/page.tsx`
- Create: `components/trade/trade-screen.tsx`

- [ ] **Step 1: Write the failing verification target**

Run: `npm run build`

Expected: FAIL once the trade page imports a missing screen component.

- [ ] **Step 2: Add the trade page entrypoint**

Use:

```tsx
import { AppShell } from "@/components/layout/app-shell";
import { TradeScreen } from "@/components/trade/trade-screen";

type TradePageProps = {
  searchParams: Promise<{ vault?: string }>;
};

export default async function TradePage({ searchParams }: TradePageProps) {
  const params = await searchParams;

  return (
    <AppShell>
      <TradeScreen vaultId={params.vault} />
    </AppShell>
  );
}
```

- [ ] **Step 3: Implement the terminal screen**

`components/trade/trade-screen.tsx` should:

- read the vault context via `getVaultById`
- render a primary execution panel
- render terminal log lines from `executionLines`
- render secondary summary cards for cost, route, and progress
- feel like a dedicated execution console rather than another dashboard

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS and `/trade` compiles with async search params support.

- [ ] **Step 5: Commit**

```bash
git add app/trade/page.tsx components/trade/trade-screen.tsx
git commit -m "feat: add trade terminal page"
```

### Task 8: Final Verification

**Files:**
- Verify only

- [ ] **Step 1: Run lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Run the dev server for a smoke check**

Run: `npm run dev`

Expected: app starts successfully and serves `/dashboard`, `/routes`, and `/trade`.

- [ ] **Step 4: Manual flow check**

Verify this exact behavior:

- open `/dashboard`
- click a vault card
- the card expands into a focused overlay
- click `Execute`
- app lands on `/trade?vault=<selected-id>`

- [ ] **Step 5: Commit**

```bash
git add app components lib docs/superpowers/plans/2026-04-11-yield-pay-ui-shell.md
git commit -m "feat: build yield pay ui shell"
```
