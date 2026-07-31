# InferX

> **The Decentralized AI Inference Marketplace powered by Stellar**

InferX is a decentralized marketplace where AI model providers list their inference endpoints and consumers access them with transparent, on-chain payments via the Stellar blockchain. Built with Next.js and Soroban smart contracts, InferX eliminates middlemen and gives providers full control over pricing while ensuring consumers get the best rates.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                         │
│                 Next.js 15 + React 19 + TailwindCSS              │
│                  Freighter Wallet Integration                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Route Handlers (API)
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ Prisma   │  │ Stellar  │  │ Encryption   │
        │ ORM      │  │ SDK      │  │ Service      │
        └────┬─────┘  └────┬─────┘  └──────────────┘
             │              │
             ▼              ▼
      ┌────────────┐ ┌────────────────────────────┐
      │ PostgreSQL │ │    Stellar Network          │
      │ (Neon/     │ │  ┌──────────┐ ┌──────────┐ │
      │  Supabase) │ │  │ Registry │ │ Escrow   │ │
      └────────────┘ │  │ Contract │ │ Contract │ │
                     │  └──────────┘ └──────────┘ │
                     │  ┌──────────┐ ┌──────────┐ │
                     │  │ Ratings  │ │ History  │ │
                     │  │ Contract │ │ Contract │ │
                     │  └──────────┘ └──────────┘ │
                     └────────────────────────────┘
```

## Features

- **Decentralized Registry** — Providers register AI endpoints on-chain via Soroban smart contracts
- **Escrow Payments** — Funds held in escrow until inference is successfully delivered
- **Transparent Ratings** — On-chain rating system for provider accountability
- **Multi-Model Support** — GPT-4o, DeepSeek, Qwen, Llama, Mistral, and more
- **Wallet-First Auth** — Freighter wallet integration for authentication and signing
- **Real-Time Health Monitoring** — Automated health checks for all endpoints
- **Chat Playground** — Interactive chat interface to test any endpoint
- **Analytics Dashboard** — Track usage, costs, earnings, and performance metrics
- **Streaming Responses** — Server-Sent Events for real-time token streaming

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Backend | Next.js Route Handlers, Prisma ORM |
| Database | PostgreSQL (Neon / Supabase) |
| Blockchain | Stellar / Soroban Smart Contracts (Rust) |
| Wallet | Freighter Browser Extension |
| Deployment | Vercel |
| Charts | Recharts |
| State | Zustand, TanStack Query |

## Prerequisites

- **Node.js 20+**
- **PostgreSQL** — [Neon](https://neon.tech) or [Supabase](https://supabase.com) recommended
- **Stellar Testnet XLM** — Get free testnet tokens from the [Stellar Friendbot](https://friendbot.stellar.org)
- **Freighter Wallet** — [Install from Chrome Web Store](https://www.freighter.app)
- *(Optional)* **Rust + Soroban CLI** — For smart contract development

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/inferX.git
cd inferX

# Install dependencies
cd apps/web
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and keys

# Push database schema
npm run db:push

# Seed development data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Set the root directory to `apps/web`
4. Add environment variables in Vercel project settings:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `DIRECT_URL` — Direct connection string for Prisma
   - `SECRET_KEY` — JWT secret
   - `ENCRYPTION_KEY` — 32-byte encryption key for API keys
   - `REGISTRY_CONTRACT_ID` / `ESCROW_CONTRACT_ID` / `RATINGS_CONTRACT_ID` / `HISTORY_CONTRACT_ID`
   - All `NEXT_PUBLIC_*` variables
5. Deploy — Vercel auto-detects Next.js via `vercel.json`
6. Run migrations on the production database:
   ```bash
   npx prisma db push
   ```

## Smart Contracts

The Soroban contracts live in `contracts/` and are written in Rust.

### Build & Deploy

```bash
# Install Soroban CLI
cargo install soroban-cli

# Build and deploy all contracts to testnet
chmod +x scripts/deploy-contracts.sh
./scripts/deploy-contracts.sh testnet

# Deploy to mainnet
./scripts/deploy-contracts.sh mainnet
```

### Contract Overview

| Contract | Purpose |
|----------|---------|
| **Registry** | Store provider and endpoint metadata on-chain |
| **Escrow** | Hold funds between consumer and provider during inference |
| **Ratings** | Immutable on-chain rating records |
| **History** | Audit trail of all marketplace transactions |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct PostgreSQL URL (for Prisma migrate) | Yes |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Yes |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` | Yes |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Soroban RPC endpoint | Yes |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | Horizon REST API endpoint | Yes |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Stellar network passphrase | Yes |
| `REGISTRY_CONTRACT_ID` | Deployed registry contract ID | Yes |
| `ESCROW_CONTRACT_ID` | Deployed escrow contract ID | Yes |
| `RATINGS_CONTRACT_ID` | Deployed ratings contract ID | Yes |
| `HISTORY_CONTRACT_ID` | Deployed history contract ID | Yes |
| `SECRET_KEY` | JWT signing secret | Yes |
| `ENCRYPTION_KEY` | 32-byte key for encrypting provider API keys | Yes |
| `ADMIN_WALLET_ADDRESS` | Admin Stellar wallet address | No |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/wallet` | Get current session via wallet |
| GET | `/api/endpoints` | List all active endpoints |
| GET | `/api/endpoints/[id]` | Get endpoint details |
| POST | `/api/providers` | Register as a provider |
| GET | `/api/providers/[id]` | Get provider profile |
| POST | `/api/inference/[endpointId]` | Run inference on an endpoint |
| POST | `/api/inference/[endpointId]/stream` | Stream inference via SSE |
| GET | `/api/transactions` | List transactions for current user |
| POST | `/api/ratings` | Submit a rating |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/health` | API health check |

## Architecture Decisions

- **Route Handlers over API Routes** — Using Next.js App Router route handlers for better type safety and streaming support
- **Prisma + PostgreSQL** — Type-safe database access with migrations; Neon/Supabase for serverless compatibility
- **On-Chain + Off-Chain Hybrid** — Critical operations (payments, ratings, registry) on Stellar; metadata and caching off-chain for performance
- **Encryption at Rest** — Provider API keys encrypted with AES-256-GCM before database storage
- **Wallet-First Identity** — Stellar wallet address as the primary identity; no traditional email/password auth
- **Edge-Ready** — Designed to run on Vercel's edge network for low-latency global access

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
