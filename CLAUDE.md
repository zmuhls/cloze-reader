# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Browser-based cloze reading game deployed on Cloudflare Workers via Kale Deploy. Gemma-3-27B (OpenRouter) selects words from Project Gutenberg passages; human players fill in the blanks. Ported from milwrite/cloze-reader (Python FastAPI + Redis) to TypeScript Hono + D1/KV.

**Live**: https://cloze-reader.cuny.qzz.io

## Commands

```bash
npm run dev          # wrangler dev — local Workers runtime at localhost:8787
npm run check        # tsc --noEmit — type check only, no build step
```

Local secrets go in `.dev.vars` (gitignored):
```
OPENROUTER_API_KEY=sk-or-...
HF_TOKEN=hf_...
```

## Architecture

**Backend** (`src/`): Hono on Cloudflare Workers. Exports a Worker-compatible request handler — no `app.listen()`. The `Env` type in `src/index.ts` defines all bindings: `DB` (D1), `CACHE` (KV), `ASSETS` (static files), plus two secrets.

**Frontend** (`public/`): Vanilla JS with ES6 modules, Tailwind CDN, no build process. Copied from milwrite/cloze-reader. All frontend `fetch()` calls use relative paths (`/api/...`) via `window.location.origin`.

**Route modules** (`src/routes/`):
- `ai.ts` — POST `/api/ai/chat`: proxies to OpenRouter, injects API key server-side
- `books.ts` — GET `/api/books/splits` and `/api/books/rows`: proxies HF Datasets API with KV caching (splits: 1h TTL, rows: 60s TTL)
- `leaderboard.ts` — GET/POST `/api/leaderboard`, `/api/leaderboard/add`, `/api/leaderboard/update`, DELETE `/api/leaderboard/clear`: D1-backed, top 10 entries
- `analytics.ts` — POST `/api/analytics/passage`, GET `summary`/`recent`/`export`/`word/:word`, DELETE `clear`: D1 passage + word-level analytics

**D1 schema**: Auto-migrates via `CREATE TABLE IF NOT EXISTS` in a middleware on first request per isolate. Canonical migration in `migrations/0001_init.sql`. Three tables: `leaderboard`, `passage_analytics`, `word_analytics`.

**Static serving**: Wrangler `assets` binding serves everything in `public/` automatically. API routes in the Worker take precedence over static files at the same path.

## Deployment

Push to `main` → Kale Deploy builds and deploys to `cloze-reader.cuny.qzz.io`. Secrets are set via the Kale MCP (`set_project_secret`), not in code or CI.

## Conventions

- Commit messages: short, lowercase, no sign-off
- Frontend JS in `public/src/` was ported from the canonical milwrite/cloze-reader repo — edit with care, changes here don't propagate back
- Kale attaches production D1/KV bindings at deploy time; `wrangler.jsonc` placeholders are for local dev only
