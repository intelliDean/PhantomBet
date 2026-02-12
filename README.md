# PhantomBet

A privacy-first decentralized prediction market with AI-powered settlement using Chainlink Runtime Environment (CRE), built for the Monad Testnet.

> **Bet in the shadows. Settle with truth.**

## 🚀 Features

- **Privacy-Preserving Betting**: Commitment-reveal scheme keeps bets private during the betting phase.
- **AI-Powered Settlement**: Automated outcome verification using GPT-4 via Chainlink CRE.
- **Monad High Performance**: Built on Monad Testnet for ultra-fast transaction finality.
- **Institutional Grade**: Compliance-friendly privacy with transparent, auditable settlement.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  Market Creation | Betting Interface | Settlement Dashboard  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Smart Contracts (Solidity)                 │
│  PredictionMarket.sol | CRESettlementOracle.sol             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Chainlink Runtime Environment (CRE)             │
│                   TypeScript Workflow                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐│
│  │  CoinGecko   │      │   OpenAI     │      │  Consensus   ││
│  │ Integration  │      │   Analysis   │      │  Mechanism   ││
│  └──────────────┘      └──────────────┘      └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
phantom-bet/
├── contracts/              # Smart contracts (Solidity/Foundry)
│   ├── src/
│   │   ├── PredictionMarket.sol
│   │   └── CRESettlementOracle.sol
├── cre-workflow/           # Chainlink CRE TypeScript workflow
│   ├── main.ts             # Main workflow logic
│   └── config.staging.json # Environment configuration
├── frontend/               # React (Vite) frontend
├── project.yaml            # CRE Project settings
└── README.md
```

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity 0.8.20
- **Blockchain**: Monad Testnet (Chain ID 10143)
- **CRE**: Chainlink Runtime Environment (TypeScript SDK)
- **AI**: OpenAI GPT-4o
- **Frontend**: React, Vite, Wagmi, RainbowKit

## 🚀 Quick Start

### 1. Configure Environment
Create a `.env` file in the root with your keys:
```env
OPENAI_API_KEY=your_openai_key
PRIVATE_KEY=your_wallet_private_key
```

### 2. Install Dependencies
```bash
# Workflow dependencies
cd cre-workflow
bun install
```

### 3. Simulate CRE Workflow
```bash
# From the project root
cre workflow simulate cre-workflow --target=staging-settings
```

### 4. Run Frontend
```bash
cd frontend
bun install
bun run dev
```

## 📖 How It Works

### 1. Privacy Betting
Users submit a hash commitment of their bet. The actual outcome choice and amount are hidden until the reveal phase.

### 2. CRE Oracle
The TypeScript workflow running in the Chainlink Runtime Environment:
1.  **Polls** the `PredictionMarket` for ready-to-settle markets.
2.  **Analyzes** the question using CoinGecko (for price targets) or OpenAI (for general knowledge).
3.  **Generates** a consensus-verified report.
4.  **Submits** the settlement to the `CRESettlementOracle` on Monad.

## 📄 License

MIT