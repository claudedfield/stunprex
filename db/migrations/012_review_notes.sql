-- 012: the review bar on staging (OT-063, the owner's yes of 22 Oct 2026).
-- One row per note written in the bar: the page's path, the text, which staging login wrote it
-- (the basic-auth user name, for example "stunprex" or "agentops"), and when. No account, no address.
-- The table exists on production too and stays empty there: the bar and its routes answer 404.
CREATE TABLE IF NOT EXISTS review_notes (
  id         bigserial   PRIMARY KEY,
  path       text        NOT NULL,
  text       text        NOT NULL,
  by_login   text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_notes_path_idx ON review_notes (path, created_at DESC);
