# Agent Instructions — Hedera Notary Log

## Project

- **Name:** Hedera-Notary-Log
- **Purpose:** Proof-of-existence app anchoring local document hashes to Hedera HCS
- **Stack:** Next.js 16, @hashgraph/sdk, Tailwind, Jest

## Dev servers

- **Web app:** `npm run dev` → http://localhost:3000
- **Requires:** Hedera testnet operator credentials in `.env.local`

## Shared config

- **Skills:** `.agents/skills/` → [cursor-skills](https://github.com/PenneconDavid/cursor-skills)
- **Rules:** `.cursor/rules/` → [cursor-rules](https://github.com/PenneconDavid/cursor-rules)
- **Connections:** see `ConnectionGuide.txt`

## Conventions

- Update `ConnectionGuide.txt` for Hedera network endpoints, API routes, and env vars (no secrets).
- Tier 2 UI skills apply.
- Ask before installing npm packages.
