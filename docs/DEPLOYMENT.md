# Deployment Guide

This document covers the full deployment process for InferX.

## Smart Contract Deployment

The Soroban contracts are deployed to the Stellar Testnet (switch `testnet` to `mainnet` for production).

### Prerequisites
- Stellar CLI: `cargo install soroban-cli`
- Funded Stellar account (use [Friendbot](https://friendbot.stellar.org) for testnet)
- Build the contracts: `cd contracts && cargo build --target wasm32-unknown-unknown --release`

### Deploy

```bash
cd contracts

# Generate deployer identity (if not already created)
stellar keys generate deployer --network testnet

# Deploy each contract
REGISTRY_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/registry.wasm --source deployer --network testnet)
ESCROW_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.wasm --source deployer --network testnet)
RATINGS_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/ratings.wasm --source deployer --network testnet)
HISTORY_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/history.wasm --source deployer --network testnet)

# Initialize registry
stellar contract invoke --id $REGISTRY_ID --network testnet --source deployer -- initialize --admin $(stellar keys address deployer)

# Initialize escrow (500 bps = 5% platform fee)
stellar contract invoke --id $ESCROW_ID --network testnet --source deployer -- initialize --admin $(stellar keys address deployer) --platform_fee_bps 500

# Initialize ratings
stellar contract invoke --id $RATINGS_ID --network testnet --source deployer -- initialize --admin $(stellar keys address deployer)

# Initialize history
stellar contract invoke --id $HISTORY_ID --network testnet --source deployer -- initialize --admin $(stellar keys address deployer)
```

Add the resulting contract IDs to your `.env` file:
```bash
REGISTRY_CONTRACT_ID=<registry_id>
ESCROW_CONTRACT_ID=<escrow_id>
RATINGS_CONTRACT_ID=<ratings_id>
HISTORY_CONTRACT_ID=<history_id>
```

## Database

InferX uses PostgreSQL. Recommended providers:
- **Neon**: [neon.tech](https://neon.tech) — serverless, great for Vercel
- **Supabase**: [supabase.com](https://supabase.com) — PostgreSQL + auth + storage

### Push schema
```bash
cd apps/web
npm run db:push
```

### Seed (development)
```bash
npm run db:seed
```

## Vercel Deployment

### One-Click Deploy

1. Import the repository on [vercel.com/new](https://vercel.com/new)
2. Set root directory to `apps/web`
3. Add environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Postgres connection string |
| `DIRECT_URL` | Same or direct connection |
| `SECRET_KEY` | Random JWT secret (e.g. `openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | 32-byte AES-256 key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` (or `mainnet`) |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `REGISTRY_CONTRACT_ID` | Deployed registry ID |
| `ESCROW_CONTRACT_ID` | Deployed escrow ID |
| `RATINGS_CONTRACT_ID` | Deployed ratings ID |
| `HISTORY_CONTRACT_ID` | Deployed history ID |

4. Click **Deploy**

### Post-Deployment

The Prisma schema is auto-pushed on first deploy. No manual migration steps needed for `db push`.

For production migrations use:
```bash
npx prisma migrate deploy
```

## CI/CD

Pushes to `main` trigger a GitHub Actions workflow that:
1. Runs all Soroban contract tests (`cargo test --release`)
2. Builds the WASM targets
3. Lints and builds the Next.js frontend

See `.github/workflows/ci.yml` for the full pipeline.

## Mobile Screenshots

To capture mobile screenshots locally:
1. Start the dev server: `npm run dev`
2. Open browser DevTools → Toggle device toolbar (Ctrl+Shift+M)
3. Select a mobile device (iPhone 12, Pixel 5, etc.)
4. Screenshot each page: landing, marketplace, chat, dashboard
5. Save to `docs/screenshots/`
