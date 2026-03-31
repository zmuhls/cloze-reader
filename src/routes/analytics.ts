import { Hono } from "hono";
import type { Env } from "../index";

interface WordData {
  word: string;
  length?: number;
  attemptsToCorrect?: number;
  hintsUsed?: string[];
  finalCorrect?: boolean;
}

interface PassageData {
  passageId: string;
  sessionId: string;
  bookTitle: string;
  bookAuthor: string;
  level: number;
  round: number;
  words: WordData[];
  totalBlanks: number;
  correctOnFirstTry: number;
  totalHintsUsed: number;
  passed: boolean;
  timestamp?: string;
}

export function analyticsRoutes() {
  const r = new Hono<{ Bindings: Env }>();

  // POST /api/analytics/passage — record a passage attempt
  r.post("/passage", async (c) => {
    const data = await c.req.json<PassageData>();

    const result = await c.env.DB.prepare(
      `INSERT INTO passage_analytics
         (passage_id, session_id, book_title, book_author, level, round,
          total_blanks, correct_on_first_try, total_hints_used, passed, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
      .bind(
        data.passageId,
        data.sessionId,
        data.bookTitle,
        data.bookAuthor,
        data.level,
        data.round,
        data.totalBlanks,
        data.correctOnFirstTry,
        data.totalHintsUsed,
        data.passed ? 1 : 0,
        data.timestamp || new Date().toISOString()
      )
      .first<{ id: number }>();

    const passageId = result?.id;

    if (passageId && data.words?.length) {
      const stmts = data.words.map((w) =>
        c.env.DB.prepare(
          `INSERT INTO word_analytics
             (passage_analytics_id, word, length, attempts_to_correct, hints_used, final_correct)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          passageId,
          w.word,
          w.length ?? w.word.length,
          w.attemptsToCorrect ?? 1,
          JSON.stringify(w.hintsUsed ?? []),
          w.finalCorrect ? 1 : 0
        )
      );
      await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, entryId: passageId, message: "Passage analytics recorded" });
  });

  // GET /api/analytics/summary
  r.get("/summary", async (c) => {
    const [total, sessions, hardest, easiest, books] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) AS cnt FROM passage_analytics").first<{ cnt: number }>(),
      c.env.DB.prepare("SELECT COUNT(DISTINCT session_id) AS cnt FROM passage_analytics").first<{ cnt: number }>(),
      c.env.DB.prepare(
        `SELECT word, SUM(CASE WHEN attempts_to_correct > 1 THEN 1 ELSE 0 END) AS retryCount
         FROM word_analytics GROUP BY word ORDER BY retryCount DESC LIMIT 10`
      ).all(),
      c.env.DB.prepare(
        `SELECT word, SUM(CASE WHEN attempts_to_correct = 1 AND final_correct = 1 THEN 1 ELSE 0 END) AS firstTryCount
         FROM word_analytics GROUP BY word ORDER BY firstTryCount DESC LIMIT 10`
      ).all(),
      c.env.DB.prepare(
        `SELECT book_title AS title, book_author AS author, COUNT(*) AS usageCount
         FROM passage_analytics GROUP BY book_title, book_author ORDER BY usageCount DESC LIMIT 10`
      ).all(),
    ]);

    return c.json({
      success: true,
      data: {
        totalPassages: total?.cnt ?? 0,
        totalSessions: sessions?.cnt ?? 0,
        hardestWords: hardest.results,
        easiestWords: easiest.results,
        popularBooks: books.results,
      },
    });
  });

  // GET /api/analytics/recent
  r.get("/recent", async (c) => {
    const count = Math.min(parseInt(c.req.query("count") || "50"), 200);
    const rows = await c.env.DB.prepare(
      `SELECT * FROM passage_analytics ORDER BY created_at DESC LIMIT ?`
    )
      .bind(count)
      .all();

    return c.json({ success: true, passages: rows.results, count: rows.results.length });
  });

  // GET /api/analytics/export
  r.get("/export", async (c) => {
    const rows = await c.env.DB.prepare(
      "SELECT * FROM passage_analytics ORDER BY created_at DESC"
    ).all();
    return c.json({ success: true, passages: rows.results, count: rows.results.length });
  });

  // GET /api/analytics/word/:word
  r.get("/word/:word", async (c) => {
    const word = c.req.param("word").toLowerCase();
    const stats = await c.env.DB.prepare(
      `SELECT
         word,
         SUM(CASE WHEN attempts_to_correct = 1 AND final_correct = 1 THEN 1 ELSE 0 END) AS firstTryCount,
         SUM(CASE WHEN attempts_to_correct > 1 THEN 1 ELSE 0 END) AS retryCount
       FROM word_analytics WHERE LOWER(word) = ? GROUP BY word`
    )
      .bind(word)
      .first();

    return c.json({
      success: true,
      data: stats || { word, firstTryCount: 0, retryCount: 0 },
    });
  });

  // DELETE /api/analytics/clear
  r.delete("/clear", async (c) => {
    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM word_analytics"),
      c.env.DB.prepare("DELETE FROM passage_analytics"),
    ]);
    return c.json({ success: true, message: "All analytics data cleared" });
  });

  return r;
}
