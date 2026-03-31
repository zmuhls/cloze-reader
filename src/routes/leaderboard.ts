import { Hono } from "hono";
import type { Env } from "../index";

export function leaderboardRoutes() {
  const r = new Hono<{ Bindings: Env }>();

  // GET /api/leaderboard
  r.get("/", async (c) => {
    const rows = await c.env.DB.prepare(
      `SELECT initials, level, round, passages_passed AS passagesPassed, date
       FROM leaderboard
       ORDER BY level DESC, round DESC, passages_passed DESC
       LIMIT 10`
    ).all();
    return c.json({
      success: true,
      leaderboard: rows.results,
      message: `Retrieved ${rows.results.length} entries`,
    });
  });

  // POST /api/leaderboard/add
  r.post("/add", async (c) => {
    const body = await c.req.json<{
      initials: string;
      level: number;
      round: number;
      passagesPassed: number;
      date?: string;
    }>();

    await c.env.DB.prepare(
      `INSERT INTO leaderboard (initials, level, round, passages_passed, date)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(
        body.initials,
        body.level,
        body.round,
        body.passagesPassed,
        body.date || new Date().toISOString()
      )
      .run();

    // Trim to top 10 by deleting lower-ranked entries
    await c.env.DB.prepare(
      `DELETE FROM leaderboard WHERE id NOT IN (
         SELECT id FROM leaderboard
         ORDER BY level DESC, round DESC, passages_passed DESC
         LIMIT 10
       )`
    ).run();

    return c.json({ success: true, message: `Added ${body.initials} to leaderboard` });
  });

  // POST /api/leaderboard/update — replace all entries
  r.post("/update", async (c) => {
    const entries = await c.req.json<
      { initials: string; level: number; round: number; passagesPassed: number; date?: string }[]
    >();

    const stmts = [
      c.env.DB.prepare("DELETE FROM leaderboard"),
      ...entries.slice(0, 10).map((e) =>
        c.env.DB.prepare(
          `INSERT INTO leaderboard (initials, level, round, passages_passed, date)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(e.initials, e.level, e.round, e.passagesPassed, e.date || new Date().toISOString())
      ),
    ];
    await c.env.DB.batch(stmts);

    return c.json({ success: true, message: "Leaderboard updated" });
  });

  // DELETE /api/leaderboard/clear
  r.delete("/clear", async (c) => {
    await c.env.DB.prepare("DELETE FROM leaderboard").run();
    return c.json({ success: true, message: "Leaderboard cleared" });
  });

  return r;
}
