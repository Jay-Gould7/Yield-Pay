# Yield Pay UI Shell Design

Date: 2026-04-11
Project: `yield-pay`
Status: Approved for planning, pending final user review before implementation

## Goal

Build the first usable UI shell for Yield Pay in Next.js App Router with Tailwind CSS, preserving the provided dark terminal-style DeFi aesthetic while reorganizing it into reusable pages and components.

This phase focuses on:

- fixing install-blocking dependency alignment so the app can run reliably
- replacing the starter homepage with product-specific navigation and layouts
- introducing grouped page modules and grouped UI components
- implementing a vault selection interaction where a clicked vault card grows from its original position into a focused analysis window
- making the vault detail surface route the user into a dedicated execution terminal page through an `Execute` action

This phase does not include:

- real wallet connectivity
- live onchain data
- real transaction execution
- backend integration
- persistent portfolio state

## Product Surfaces

The application will ship with four user-visible surfaces:

### 1. Dashboard

Primary overview page for yield opportunities.

Responsibilities:

- show a ranking board of vaults
- present top-level metrics and operational status
- allow selection of a vault card
- launch a focused vault analysis overlay from the clicked card

Route:

- `/dashboard`

### 2. Routes

Analytical page for route comparison and execution path review.

Responsibilities:

- display routing candidates
- compare gas cost, latency, confidence, and projected yield delta
- support a visual narrative consistent with the dashboard

Route:

- `/routes`

### 3. Trade Terminal

Dedicated execution-oriented screen that feels like a transaction console.

Responsibilities:

- show selected vault context
- display execution steps, parameters, route summary, and live-style terminal logs
- serve as the destination after pressing `Execute` from a vault detail overlay

Route:

- `/trade`

### 4. Vault Detail Overlay

Focused analysis surface opened from the dashboard without leaving dashboard context.

Responsibilities:

- originate visually from the specific clicked vault card
- present break-even analysis, cost breakdown, and execution CTA
- close back into the original card
- route to `/trade` when the user presses `Execute`

Initial implementation form:

- local overlay state on `/dashboard`, not a standalone public route in phase 1

## Interaction Model

### Shared-Element Expansion

The vault interaction should not behave like a standard modal or right drawer.

Required effect:

- each vault card in the dashboard grid is clickable
- on click, the selected card visually expands from its exact grid position
- surrounding dashboard content dims and de-emphasizes
- the expanded surface settles into a centered analysis window
- close action reverses the motion back into the original card

Target feel:

- macOS-like zoom/focus transition
- precise, calm, and product-like, not flashy

Implementation direction:

- use client-side measurement of the clicked card bounding box
- render a fixed overlay layer above the dashboard
- animate transform, size, border, and opacity from source card to final window state
- use a light spring or eased cubic transition

Notes:

- first implementation can be done with React state plus CSS transforms
- a motion library already exists in dependencies and may be used if it simplifies the shared-element animation
- the interaction should degrade gracefully on smaller screens by opening into a near-fullscreen panel

### Execute Flow

The navigation contract is:

- user opens a vault from `/dashboard`
- user reviews the detail overlay
- user presses `Execute`
- app navigates to `/trade?vault=<vault-slug>`

The trade page should read the vault slug from search params and render matching mock context.

## Visual Direction

The implementation should preserve the approved reference style:

- dark background with near-black layered surfaces
- acid/neon green used as the primary accent
- mono numerics and technical labels
- dense metric presentation
- terminal-inspired execution areas
- square or near-square corners, avoiding soft rounded SaaS defaults

The implementation should deliberately reorganize the visual system into reusable primitives.

Avoid:

- default starter Next.js layout
- generic dashboard SaaS cards
- purple gradients
- airy consumer fintech styling

## Information Architecture

### Top-Level Navigation

Persistent application shell with:

- left sidebar
- top status bar
- main content region

Navigation items for phase 1:

- Dashboard
- Routes
- Trade

Optional placeholders that may remain visual-only:

- Portfolio
- Settings

### Entry Route

The root route will redirect to `/dashboard` so the app opens directly into the main product surface.

## Component Grouping

Components will be grouped by domain and shell responsibility.

### `components/layout/`

Shared application chrome.

Planned components:

- `AppShell`
- `Sidebar`
- `Topbar`
- `StatusStrip`

### `components/dashboard/`

Dashboard-specific modules.

Planned components:

- `DashboardHero`
- `VaultGrid`
- `VaultCard`
- `VaultDetailOverlay`
- `VaultAnalysisPanel`

### `components/routes/`

Route-analysis modules.

Planned components:

- `RoutesHero`
- `RouteTable`
- `RouteCard`
- `RouteInsightPanel`

### `components/trade/`

Execution terminal modules.

Planned components:

- `TradeTerminal`
- `TradeSummary`
- `ExecutionLog`
- `ExecutionStepper`

### `components/shared/`

Reusable visual primitives.

Planned components:

- `SectionHeader`
- `MetricChip`
- `StatusBadge`
- `TerminalButton`
- `DataLabel`

## Page Grouping

Routes will be organized as:

- `app/page.tsx`
- `app/dashboard/page.tsx`
- `app/routes/page.tsx`
- `app/trade/page.tsx`

Support modules may live in:

- `lib/mock-data.ts`
- `lib/types.ts`

The dashboard page will own the vault overlay state in phase 1.

## Data Strategy

Use static mock data for all vaults, routes, and trade terminal status in this phase.

The mock model should be sufficient to power:

- vault cards
- selected vault detail overlay
- route comparison sections
- trade terminal header and summary blocks
- execution log entries

## Dependency Strategy

Current install issue is caused by a major-version mismatch between `wagmi` and `@rainbow-me/rainbowkit`.

This phase should prioritize a stable installable UI shell. Since wallet integration is not part of phase 1 behavior, the implementation may either:

1. align versions so installation succeeds cleanly, or
2. remove the unused conflicting wallet dependency temporarily

Preferred implementation direction:

- simplify the dependency graph for phase 1 and keep only what the UI shell actually uses

This avoids shipping a broken install path while no wallet code exists yet.

## Responsive Behavior

Desktop-first, but still usable on smaller screens.

Expected behavior:

- sidebar may collapse or compress on narrower screens
- dashboard vault grid reduces column count responsively
- overlay becomes larger relative to viewport on tablets
- overlay may become almost full-screen on phones
- trade terminal stacks panels vertically on smaller screens

## Initial Build Scope

Implementation for the first pass is complete when:

- `npm install` succeeds without peer-resolution failure
- app boots into `/dashboard`
- dashboard renders grouped vault cards in the approved style
- clicking a vault expands it into a focused detail overlay
- overlay contains an `Execute` action
- `Execute` routes into `/trade` with the selected vault context
- `/routes` and `/trade` both exist and match the same visual language
- the starter boilerplate UI is fully removed

## Risks And Controls

### Risk: Shared-element motion becomes brittle

Control:

- keep the first implementation limited to dashboard cards only
- animate one focused overlay at a time
- use deterministic mock data and fixed structure

### Risk: wallet dependencies keep blocking install

Control:

- do not couple first-pass UI work to wallet libraries
- reduce or align unused dependencies before implementation

### Risk: overbuilding before data exists

Control:

- keep all features mock-backed
- avoid backend abstractions in this phase

## Open Decisions Already Resolved

The following decisions are locked for phase 1:

- preserve the reference visual mood but allow structural reorganization
- use Tailwind CSS for implementation
- dashboard cards each represent a vault
- vault detail opens via growth from the clicked card, not a generic modal or drawer
- the overlay `Execute` action navigates to the trade terminal page

## Implementation Readiness

This design is narrow enough for a single implementation plan.

No remaining blocking ambiguity is known for phase 1.
