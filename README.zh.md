# Yield-Pay

**让 Gas 费消失在未来的收益里。**

<!-- README-I18N:START -->

[English](./README.md) | **汉语**

<!-- README-I18N:END -->

> LI.FI Builder Edition 黑客松参赛作品 — DeFi UX 赛道

---

## 什么是 Yield-Pay？

Yield-Pay 是一个**收益路由界面**，它将 DeFi 手续费的心理障碍彻底消除。它不是让用户在操作前支付桥接费用，而是：

1. 从 **LI.FI Earn API** 获取实时 APY 和费用数据
2. 计算你的精确**回本周期**——收益需要多少天才能覆盖 gas 成本
3. 通过 **LI.FI Composer** 一键执行存款到最优收益池

最终效果？用户看到的是"此操作将在 4.5 天内通过收益回本"，而不是"−$5.23 gas 费"。

---

## 核心功能

| 功能 | 说明 |
|---|---|
| **回本倒计时** | 签名前即显示收益多少天可以覆盖 gas 成本 |
| **一键金库存款** | 单笔交易完成跨链存入高收益金库 |
| **实时 APY 展示** | 从 LI.FI 获取的金库实时年化收益数据 |
| **费用透明** | 确认前清晰展示 feeCosts 和 gasCosts 明细 |
| **智能金库筛选** | 自动高亮 48 小时内可覆盖费用的金库 |
| **Base 链优先** | 专为 Base（Coinbase L2）构建，支持 injected wallet + WalletConnect |

---

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org)（App Router）
- **钱包**: [wagmi v2](https://wagmi.sh) + [RainbowKit](https://rainbowkit.com) — 仅 Base 链
- **数据获取**: [TanStack Query v5](https://tanstack.com/query)
- **DeFi 路由**: [@lifi/sdk](https://li.fi)
- **样式**: Tailwind CSS v4
- **测试**: Vitest

---

## 快速开始

### 前置要求

- Node.js 20+
- Web3 钱包（MetaMask、Coinbase Wallet 或任意 WalletConnect 兼容钱包）
- 可选：`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`（用于 WalletConnect 支持）

### 安装

```bash
git clone https://github.com/your-org/yield-pay.git
cd yield-pay
npm install
```

### 环境变量

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id  # 可选
NEXT_PUBLIC_LIFI_API_KEY=your_lifi_api_key             # 可选
LIFI_API_KEY=your_lifi_api_key                         # 可选（服务端）
```

### 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，连接钱包，开始收益路由。

---

## 工作原理

```
用户输入（金额 + 金库选择）
        │
        ▼
LI.FI Earn API → 获取金库 APY + 历史数据
        │
        ▼
回本周期计算
  breakEvenDays = totalFeesUsd / (principalUsd × apyDecimal / 365)
        │
        ▼
展示："X.X 天回本" + 分段进度条
        │
        ▼
LI.FI Composer API → 生成存款交易
        │
        ▼
用户签名（Base 链 — 低 gas，快速确认）
```

---

## 项目结构

```
app/
├── config/
│   ├── wagmi.ts          # Base 专用的 wagmi 配置
│   └── lifi.ts           # LI.FI SDK 配置
├── providers.tsx         # React Provider 层级
├── page.tsx              # 首页（金库选择 + 执行）
├── dashboard/            # 金库仪表盘
├── trade/                # 交易界面
├── routes/               # 路由分析
└── layout.tsx            # 根布局

components/
├── home/                 # HomeScreen、VaultModal、VaultIcon
├── dashboard/             # VaultCard、VaultDetailOverlay、VaultGrid
├── wallet/               # ConnectWalletButton、WalletStatusBadge
├── shared/               # SegmentedProgressBar、TransactionAnimation
└── rb/                   # 像素/街机风格组件

hooks/
└── useYieldPay.ts        # 核心 hook：获取金库、报价、回本计算

lib/
├── constants.ts          # CHAINS、TOKENS、VAULTS
├── calculations.ts       # 收益/APY 计算
└── types.ts              # Vault、RouteCandidate 类型
```

---

## UX 创新

传统 DeFi 存款：
> "现在支付 $5.23 gas 费，然后开始赚取 12% 年化收益。"

Yield-Pay 存款：
> "此操作将在 **4.5 天**内通过收益回本。之后每一分钱都是纯利润。"

Yield-Pay 不是展示减法，而是展示**加法**——回本倒计时将用户的心理从"付费"转变为"投资"。

---

## 黑客松参赛信息

- **赛事**: LI.FI DeFi Mullet Hackathon 1 — Builder Edition
- **赛道**: DeFi UX Challenge
- **核心创新**: 将 gas 成本重新定义为"未来收益抵扣"，配合透明的回本计算
- **技术栈**: LI.FI SDK + Earn API + Composer API、Next.js 16、wagmi、Base 链

---

## 可用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产环境构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm run test` | 运行 Vitest 测试（无头） |

---

## 致谢

### 特别感谢

衷心感谢 **LI.FI** 举办此次黑客松，感谢团队提供的优秀 SDK 和 API，让 Yield-Pay 成为可能。LI.FI 团队的支持和高质量的开发者工具让这个项目的构建成为一段绝佳的体验。

### 团队成员

Yield-Pay 由以下成员用心打造：

- [@wkarry450-max](https://github.com/wkarry450-max)
- [@Igor777-Li](https://github.com/Igor777-Li)
- [@fearless-java](https://github.com/fearless-java)
- [@Jay-Gould7](https://github.com/Jay-Gould7)

---

## 开源协议

MIT
