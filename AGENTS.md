# AGENTS.md — Cloze Reader (Kale Deploy)

## What This Is

Browser-based cloze reading game. Uses Gemma-3-27B via OpenRouter to select words from Project Gutenberg passages and return them to human readers as fill-in-the-blank exercises.

## Architecture

- **Runtime**: Cloudflare Workers via Kale Deploy
- **Framework**: Hono (TypeScript)
- **Frontend**: Vanilla JS with ES6 modules in `public/` — no build process
- **Backend**: `src/index.ts` + route modules in `src/routes/`
- **Data**: D1 (SQLite) for leaderboard + analytics, KV for HF API caching
- **AI**: OpenRouter proxy at `/api/ai/chat` — API key stays server-side

## Commands

```bash
npm run dev          # Local dev server (wrangler dev)
npm run check        # TypeScript type check
```

## Project Secrets (set via Kale MCP)

- `OPENROUTER_API_KEY` — required for AI word selection and hints
- `HF_TOKEN` — optional, for authenticated HF Datasets access

## Route Map

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Frontend (static) |
| `/admin` | GET | Analytics dashboard (static) |
| `/api/health` | GET | Health check |
| `/api/ai/chat` | POST | OpenRouter proxy |
| `/api/books/splits` | GET | HF Datasets splits (cached) |
| `/api/books/rows` | GET | HF Datasets rows (cached) |
| `/api/leaderboard` | GET | Top 10 scores |
| `/api/leaderboard/add` | POST | Submit score |
| `/api/analytics/passage` | POST | Record attempt |
| `/api/analytics/summary` | GET | Aggregate stats |
| `/api/analytics/recent` | GET | Recent attempts |

## Conventions

- Commit messages: short, lowercase, no sign-off
- Frontend JS in `public/src/` is ported from milwrite/cloze-reader — edit carefully
- D1 schema auto-migrates on first request (CREATE IF NOT EXISTS)
- Static assets served by Wrangler `assets` binding
