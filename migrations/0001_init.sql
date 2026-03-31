-- Leaderboard: top scores sorted by composite rank
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  initials TEXT NOT NULL,
  level INTEGER NOT NULL,
  round INTEGER NOT NULL,
  passages_passed INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank
  ON leaderboard(level DESC, round DESC, passages_passed DESC);

-- Passage-level analytics
CREATE TABLE IF NOT EXISTS passage_analytics (
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
);
CREATE INDEX IF NOT EXISTS idx_passage_created
  ON passage_analytics(created_at DESC);

-- Word-level analytics
CREATE TABLE IF NOT EXISTS word_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passage_analytics_id INTEGER NOT NULL REFERENCES passage_analytics(id),
  word TEXT NOT NULL,
  length INTEGER,
  attempts_to_correct INTEGER NOT NULL DEFAULT 1,
  hints_used TEXT NOT NULL DEFAULT '[]',
  final_correct INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_word_text ON word_analytics(word);
CREATE INDEX IF NOT EXISTS idx_word_passage ON word_analytics(passage_analytics_id);
