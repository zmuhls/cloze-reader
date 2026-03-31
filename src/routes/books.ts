import { Hono } from "hono";
import type { Env } from "../index";

const HF_BASE = "https://datasets-server.huggingface.co";

export function booksRoutes() {
  const r = new Hono<{ Bindings: Env }>();

  // GET /api/books/splits — proxy HF datasets splits with KV cache
  r.get("/splits", async (c) => {
    const dataset = c.req.query("dataset") || "manu/project_gutenberg";
    const cacheKey = `splits:${dataset}`;

    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) return c.json(JSON.parse(cached));

    const url = `${HF_BASE}/splits?dataset=${encodeURIComponent(dataset)}`;
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "cloze-reader/1.0",
        ...(c.env.HF_TOKEN ? { Authorization: `Bearer ${c.env.HF_TOKEN}` } : {}),
      },
    });

    if (!resp.ok) return c.json({ error: `Upstream ${resp.status}` }, resp.status as 502);

    const data = await resp.json();
    await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 3600 });
    return c.json(data);
  });

  // GET /api/books/rows — proxy HF datasets rows with KV cache
  r.get("/rows", async (c) => {
    const dataset = c.req.query("dataset") || "manu/project_gutenberg";
    const config = c.req.query("config") || "default";
    const split = c.req.query("split") || "en";
    const offset = c.req.query("offset") || "0";
    const length = c.req.query("length") || "1";

    const cacheKey = `rows:${dataset}:${config}:${split}:${offset}:${length}`;
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) return c.json(JSON.parse(cached));

    const params = new URLSearchParams({ dataset, config, split, offset, length });
    const url = `${HF_BASE}/rows?${params}`;
    const resp = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "cloze-reader/1.0",
        ...(c.env.HF_TOKEN ? { Authorization: `Bearer ${c.env.HF_TOKEN}` } : {}),
      },
    });

    if (!resp.ok) return c.json({ error: `Upstream ${resp.status}` }, resp.status as 502);

    const data = await resp.json();
    await c.env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 60 });
    return c.json(data);
  });

  return r;
}
