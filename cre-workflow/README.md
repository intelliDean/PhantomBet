# PhantomBet CRE Workflow

Professional oracle workflow for automated, AI-powered prediction market settlement using the Chainlink Runtime Environment (CRE).

## 🏛️ Architecture

This workflow follows a modular, consensus-backed design:

- **`src/blockchain-client.ts`**: Uses the CRE `EVMClient` for secure on-chain reads and `writeReport` transactions.
- **`src/data-sources.ts`**: Implements `HTTPClient` fetches wrapped in `runInNodeMode` to ensure the DON reaches consensus on off-chain data.
- **`src/ai-analyzer.ts`**: Leverages GPT-4 with DON consensus to determine objective market outcomes.
- **`main.ts`**: The entry point coordinating the end-to-end settlement lifecycle.

## 🚀 Key Patterns

1. **Decentralized Consensus**: All off-chain fetches (News, Prices, AI) are executed via `runtime.runInNodeMode`, ensuring results are verified and agreed upon by the entire DON.
2. **On-chain Integrity**: Settlements are submitted using the two-step `runtime.report()` + `evmClient.writeReport()` pattern for cryptographically secure, consensus-backed writes.
3. **Type Safety**: Built with TypeScript and Viem for robust, type-safe contract interactions.

## 🛠️ Usage

### 1. Install
```bash
bun install
```

### 2. Simulate
```bash
cre workflow simulate . --target=staging-settings
```

### 3. Deploy
```bash
cre workflow deploy . --target=production-settings
```
