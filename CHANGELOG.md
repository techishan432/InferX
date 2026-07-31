# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full-stack decentralized AI inference marketplace
- **Next.js 15 frontend** with App Router, React 19, TypeScript
- **4 Soroban smart contracts**: Registry, Escrow, Ratings, History
- **Freighter wallet integration** for authentication and transaction signing
- **Chat playground** with streaming (SSE) and markdown rendering
- **Marketplace** with filters, search, sorting, pagination
- **Provider dashboard** with revenue charts and endpoint management
- **Consumer dashboard** with spending analytics and conversation history
- **Transaction history** with filterable views
- **Analytics page** with platform-wide metrics
- **Prisma ORM** with PostgreSQL (Neon/Supabase)
- **AES-256 encryption** for provider API keys
- **GitHub Actions CI/CD** pipeline
- **59 passing Soroban contract tests**

### Deployed
- All 4 contracts deployed to Stellar Testnet
- Registry: `CCL5HTVAJUHP73OG4K3MVBVUPPRTY7UBKB2346YDDVUCE7SEQFZWTQYV`
- Escrow: `CBIBPQJ6MBZHZI5CUXA7O4K4SLJELDIJOUP2KOJQR5K5OBUN5OVP3NOS`
- Ratings: `CD2ZMDC3NHIU2EA66CCKXIDG5K3X4E5QXMRCEG7EJIBQB3VWJ5NZ2LKZ`
- History: `CBXPMFNSM3BZPZZOA4AXOCMVOWN2Q4RKME7RRYTFEUQWXP4YSUW7ZUZE`

### Fixed
- URL sync infinite loop on marketplace page (`history.replaceState` rate limit)
- Navbar visibility on navigation across routes
- Dashboard access for unauthenticated users (prompt instead of redirect)
- BigInt/Decimal serialization errors in API responses
- Freighter wallet connection robustness with retry logic
- 401 error spam from React Query on auth-required endpoints
