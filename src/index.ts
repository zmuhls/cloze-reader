import { Hono } from "hono";
import { cors } from "hono/cors";
import { aiRoutes } from "./routes/ai";
import { booksRoutes } from "./routes/books";
import { leaderboardRoutes } from "./routes/leaderboard";
import { analyticsRoutes } from "./routes/analytics";

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  OPENROUTER_API_KEY: string;
  HF_TOKEN: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS for API routes
app.use("/api/*", cors());

// Auto-migrate D1 on first request per isolate
let migrated = false;
app.use("*", async (c, next) => {
  if (!migrated) {
    try {
      await c.env.DB.batch([
        c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS leaderboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          initials TEXT NOT NULL,
          level INTEGER NOT NULL,
          round INTEGER NOT NULL,
          passages_passed INTEGER NOT NULL DEFAULT 0,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
        c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS passage_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          passage_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          book_title TEXT NOT NULL DEFAULT '',
          book_author TEXT NOT NULL DEFAULT '',
          level INTEGER NOT NULL DEFAULT 1,
          round INTEGER NOT NULL DEFAULT 1,
          total_blanks INTEGER NOT NULL DEFAULT 0,
          correct_on_first_try INTEGER NOT NULL DEFAULT 0,
          total_hints_used INTEGER NOT NULL DEFAULT 0,
          passed INTEGER NOT NULL DEFAULT 0,
          timestamp TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
        c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS word_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          passage_analytics_id INTEGER NOT NULL REFERENCES passage_analytics(id),
          word TEXT NOT NULL,
          length INTEGER,
          attempts_to_correct INTEGER NOT NULL DEFAULT 1,
          hints_used TEXT NOT NULL DEFAULT '[]',
          final_correct INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`),
      ]);
    } catch {
      // Tables likely already exist — continue
    }
    migrated = true;
  }
  await next();
});

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Route groups
app.route("/api/ai", aiRoutes());
app.route("/api/books", booksRoutes());
app.route("/api/leaderboard", leaderboardRoutes());
app.route("/api/analytics", analyticsRoutes());

export default app;
