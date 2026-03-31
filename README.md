# Cloze Reader

An interactive reading comprehension game using AI to generate cloze (fill-in-the-blank) exercises from public domain literature. Deployed on Cloudflare Workers via [Kale Deploy](https://cuny.qzz.io/kale/mcp).

**Live**: [cloze-reader.cuny.qzz.io](https://cloze-reader.cuny.qzz.io)

## How It Works

Passages from Project Gutenberg are streamed via the Hugging Face Datasets API. Gemma-3-27B (via OpenRouter) selects contextually meaningful words to remove, producing fill-in-the-blank exercises that test reading comprehension through contextual inference. Players can consult structured hints about part of speech, sentence role, and synonymy without being given the answer directly.

## Architecture

- **Runtime**: Cloudflare Workers (Hono, TypeScript)
- **Frontend**: Vanilla JS, ES6 modules, Tailwind CDN — no build process
- **AI**: Gemma-3-27B via OpenRouter, proxied server-side at `/api/ai/chat`
- **Data**: Project Gutenberg via HF Datasets API, cached in Workers KV
- **Storage**: D1 (SQLite) for leaderboard and gameplay analytics

## Development

```bash
npm install
npm run dev          # wrangler dev — local Workers runtime
npm run check        # TypeScript type check
```

Create `.dev.vars` for local secrets:

```
OPENROUTER_API_KEY=sk-or-...
HF_TOKEN=hf_...
```

## Deployment

Push to `main` triggers Kale Deploy → `cloze-reader.cuny.qzz.io`. Secrets are set via the Kale MCP.

## Origin

Ported from [milwrite/cloze-reader](https://github.com/milwrite/cloze-reader) (Python FastAPI + Redis on Railway) to Cloudflare Workers with D1/KV.
