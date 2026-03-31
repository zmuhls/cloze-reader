import { Hono } from "hono";
import type { Env } from "../index";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function aiRoutes() {
  const r = new Hono<{ Bindings: Env }>();

  // POST /api/ai/chat — proxy to OpenRouter with server-side key
  r.post("/chat", async (c) => {
    const key = c.env.OPENROUTER_API_KEY;
    if (!key) return c.json({ error: "AI service not configured" }, 503);

    const body = await c.req.json<{
      model?: string;
      messages: unknown[];
      max_tokens?: number;
      temperature?: number;
      response_format?: unknown;
    }>();

    const payload: Record<string, unknown> = {
      model: body.model || "google/gemma-3-27b-it",
      messages: body.messages,
      max_tokens: body.max_tokens ?? 200,
      temperature: body.temperature ?? 0.5,
    };
    if (body.response_format) payload.response_format = body.response_format;

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://cloze-reader.cuny.qzz.io",
        "X-Title": "Cloze Reader",
      },
      body: JSON.stringify(payload),
    });

    return new Response(resp.body, {
      status: resp.status,
      headers: { "Content-Type": resp.headers.get("Content-Type") || "application/json" },
    });
  });

  return r;
}
