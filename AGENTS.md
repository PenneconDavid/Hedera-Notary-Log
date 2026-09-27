# Agent Instructions — Hedera Notary Log

## Project

- **Name:** Hedera-Notary-Log
- **Purpose:** Proof-of-existence app anchoring local document hashes to Hedera HCS
- **Stack:** Next.js 16, @hashgraph/sdk, Tailwind, Jest

## Dev servers

- **Web app:** `npm run dev` → http://localhost:3000
- **Requires:** Hedera testnet operator credentials in `.env.local`

## Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` → http://localhost:3000 |
| Test | `npm test` (Jest) |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build | `npm run build` |

Dev server and any test that touches the network need Hedera testnet operator credentials in `.env.local` (names in `ConnectionGuide.txt`, never values).

## Definition of done

- `npm test`, typecheck, and lint pass.
- UI changes: `visual-qa-testing` on the changed page, console clean.
- `ConnectionGuide.txt` updated if any Hedera endpoint, route, or env var changed.

## Shared config

- **Skills:** `.agents/skills/` → [cursor-skills](https://github.com/PenneconDavid/cursor-skills)
- **Rules:** `.cursor/rules/` → [cursor-rules](https://github.com/PenneconDavid/cursor-rules)
- **Connections:** see `ConnectionGuide.txt`

## Conventions

- Update `ConnectionGuide.txt` for Hedera network endpoints, API routes, and env vars (no secrets).
- Tier 2 UI skills apply.
- Ask before installing npm packages.
