# Contributing to InferX

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/techishan432/InferX.git
   cd InferX
   ```

2. **Install frontend dependencies**
   ```bash
   cd apps/web
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and API keys
   ```

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: seed with test data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **For contract development, install Soroban CLI**
   ```bash
   cargo install --locked soroban-cli
   ```

## Project Structure

```
InferX/
├── apps/web/              # Next.js 15 full-stack app
│   ├── src/
│   │   ├── app/           # App Router pages and API routes
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities (Prisma, Stellar, encryption)
│   │   └── store/         # Zustand state management
│   └── prisma/            # Database schema
├── contracts/             # Soroban smart contracts
│   └── contracts/
│       ├── registry/      # Provider & endpoint registry
│       ├── escrow/        # Payment escrow
│       ├── ratings/       # On-chain ratings
│       └── history/       # Transaction history
└── docs/                  # Documentation
```

## Coding Standards

### TypeScript/React
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use functional components with hooks
- Keep components < 300 lines
- Use Zod for runtime validation
- Use `@/` import aliases

### Soroban Contracts
- Follow Rust idioms and naming conventions
- All public functions must have doc comments
- Write tests for every function in the same file
- Use `#[cfg(test)]` module for tests

### Commits
- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`
- Example: `feat(marketplace): add price range filter`

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with tests
4. Run linters and tests:
   ```bash
   cd apps/web && npm run lint && npm run build
   cd contracts && cargo test --release
   ```
5. Commit with conventional commits
6. Push and open a PR on GitHub
7. Wait for CI to pass and for a maintainer review

## Reporting Bugs

When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS version
- Wallet extension version (if applicable)
- Console errors / network tab screenshots

## Feature Requests

Open an issue with `[Feature]` prefix. Describe:
- Problem you're solving
- Proposed solution
- Alternatives considered
- Additional context / mockups

## Questions?

Open a GitHub Discussion or reach out on [Stellar Dev Discord](https://discord.gg/stellardev).
