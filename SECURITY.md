# Security Policy

## Supported Versions

InferX is actively developed. Only the latest release on `main` branch is supported with security updates.

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it responsibly:

1. Email the maintainers at: **security@inferx.dev** (or open a private vulnerability report on GitHub)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce / proof of concept
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Architecture

### API Key Encryption
All provider API keys are encrypted at rest using **AES-256-GCM**:
- Unique initialization vectors (IVs) per key
- Encryption key stored in environment (`ENCRYPTION_KEY`)
- Keys are never exposed in the browser or API responses
- See `src/lib/encryption.ts` for implementation

### Authentication
- **Wallet-based auth**: Stellar wallet address is the primary identity
- **JWT sessions**: HTTP-only, Secure, SameSite=Lax cookies
- **No passwords**: No traditional credential storage
- See `src/lib/auth.ts` and `src/app/api/auth/connect/route.ts`

### On-chain Security
- Soroban contracts use **admin-only** functions for privileged operations
- Escrow contracts prevent double-spend and race conditions
- Access control via `require_auth()` on all state-modifying functions
- Contract state stored in Stellar persistent storage with TTL

### Frontend Security
- CSP headers configured via Next.js
- No inline scripts or eval
- All external links use `rel="noopener noreferrer"`
- Input validation with Zod on all Server Actions

### Infrastructure
- Secrets stored in Vercel environment variables
- Direct database URL uses IAM authentication when available
- No secrets in git history or client bundles (verified via `env` scanning)
- CI runs security audits via `npm audit` (warnings logged, critical blocks)

## Best Practices for Providers

1. **Never share your API key** — it's encrypted in our database
2. **Rotate API keys regularly** — delete and re-add endpoints to update
3. **Use dedicated API keys** — create a provider-specific key, don't reuse one with elevated privileges
4. **Monitor your endpoints** — use the dashboard to watch for unusual traffic

## Best Practices for Consumers

1. **Keep Freighter locked** when not actively using it
2. **Verify transaction details** before signing in the Freighter popup
3. **Only connect to trusted sites** — InferX will never ask for your secret key
4. **Check the URL** — always verify you're on the legitimate InferX domain

## Responsible Disclosure

We appreciate the security research community. Researchers who report valid vulnerabilities:
- Will be credited (if desired) in our security advisories
- Will receive thanks on our blog / social channels
- May be invited to participate in private pre-release testing

## Audit Status

Smart contracts have been internally reviewed. External audit is planned prior to mainnet launch.
