# Yield-Pay

**Make Gas Fees Disappear Into Future Yield.**

<!-- README-I18N:START -->

**English** | [汉语](./README.zh.md)

<!-- README-I18N:END -->

> A LI.FI Builder Edition Hackathon submission — DeFi UX Challenge

---

## What Is Yield-Pay?

Yield-Pay is a **yield routing interface** that turns the psychological barrier of DeFi gas costs into a thing of the past. Instead of asking users to pay bridge fees upfront, it:

1. Fetches real-time APY and fee data from **LI.FI Earn API**
2. Computes your exact **break-even timeline** — how many days until your yield covers the gas cost
3. Executes a **one-click deposit** into the best-performing vault via **LI.FI Composer**

The result? Users see "this operation will pay for itself in 4.5 days" instead of "−$5.23 gas."

---

## Key Features

| Feature | Description |
|---|---|
| **Break-Even Countdown** | Shows exactly how many days until your yield recoups your gas cost — before you sign |
| **One-Click Vault Deposit** | Execute cross-chain deposits into high-yield vaults in a single transaction |
| **Real-Time APY Display** | Live vault APY data fetched from LI.FI |
| **Cost Transparency** | See feeCosts and gasCosts broken down before confirmation |
| **Smart Vault Filtering** | Auto-highlights vaults that can recoup fees within 48 hours |
| **Base Chain Optimized** | Built for Base (Coinbase L2) with injected wallet + WalletConnect support |

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Wallet**: [wagmi v2](https://wagmi.sh) + [RainbowKit](https://rainbowkit.com) — Base chain only
- **Data Fetching**: [TanStack Query v5](https://tanstack.com/query)
- **DeFi Routing**: [@lifi/sdk](https://li.fi)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Web3 wallet (MetaMask, Coinbase Wallet, or any WalletConnect-compatible wallet)
- Optional: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` for WalletConnect support

### Installation

```bash
git clone https://github.com/your-org/yield-pay.git
cd yield-pay
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id  # Optional
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key             # Optional
LIFI_API_KEY=your_lifi_api_key                         # Optional (server-side)
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — connect your wallet and start routing yield.

---

## How It Works

```
User Input (Amount + Vault Selection)
        │
        ▼
LI.FI Earn API → Fetch Vault APY + Historical Data
        │
        ▼
Break-Even Calculation
  breakEvenDays = totalFeesUsd / (principalUsd × apyDecimal / 365)
        │
        ▼
Display: "Recoups in X.X days" + Segmented Progress Bar
        │
        ▼
LI.FI Composer API → Generate Deposit Transaction
        │
        ▼
User Signs (Base chain — low gas, fast confirmation)
```

---

## Project Structure

```
app/
├── config/
│   ├── wagmi.ts          # Base-only wagmi configuration
│   └── lifi.ts           # LI.FI SDK configuration
├── providers.tsx         # React provider hierarchy
├── page.tsx             # Home page (vault selection + execute)
├── dashboard/           # Vault dashboard
├── trade/               # Trade interface
├── routes/              # Route analysis
└── layout.tsx           # Root layout

components/
├── home/                # HomeScreen, VaultModal, VaultIcon
├── dashboard/           # VaultCard, VaultDetailOverlay, VaultGrid
├── wallet/              # ConnectWalletButton, WalletStatusBadge
├── shared/              # SegmentedProgressBar, TransactionAnimation
└── rb/                  # Pixel/arcade aesthetic components

hooks/
└── useYieldPay.ts       # Core hook: vault fetch, quote, break-even

lib/
├── constants.ts         # CHAINS, TOKENS, VAULTS
├── calculations.ts      # Yield/APY math
└── types.ts             # Vault, RouteCandidate types
```

---

## UX Innovation

Traditional DeFi deposit:
> "Pay $5.23 gas now, then start earning 12% APY."

Yield-Pay deposit:
> "This operation will pay for itself through yield in **4.5 days**. After that, every dollar is pure profit."

Instead of showing a subtraction, Yield-Pay shows an **addition** — the days-until-profit countdown shifts user psychology from "paying" to "investing."

---

## Hackathon Submission Details

- **Event**: LI.FI DeFi Mullet Hackathon 1 — Builder Edition
- **Track**: DeFi UX Challenge
- **Core Innovation**: Reframe gas cost as "future yield offset" with transparent break-even math
- **Built With**: LI.FI SDK + Earn API + Composer API, Next.js 16, wagmi, Base chain

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests (headless) |

---

## Acknowledgments

### Special Thanks

Huge thanks to **LI.FI** for organizing this hackathon and providing the incredible SDK and APIs that made Yield-Pay possible. The LI.FI team's support and the quality of their developer tools made building this project a fantastic experience.

### Team

Yield-Pay is built with passion by:

- [@wkarry450-max](https://github.com/wkarry450-max)
- [@Igor777-Li](https://github.com/Igor777-Li)
- [@fearless-java](https://github.com/fearless-java)
- [@Jay-Gould7](https://github.com/Jay-Gould7)

---

## License

MIT
