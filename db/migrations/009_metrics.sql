-- 009: our own visit counters (D-WEB-31, the owner's decision of 13 Oct 2026: no outside tool).
--
-- metrics_daily holds totals only: how many times a thing happened on a day. Nothing in it is
-- about a visitor. kind is 'pageview' (key: the page's path), 'referrer' (key: the other site's
-- host name), 'event' (key: the event's name and a short detail) or 'visitor' (key: 'new' or
-- 'returning').
--
-- metrics_visitors is the only table with a row per visitor, and it exists to tell "new" from
-- "returning". A row holds a code (a one-way hash of the IP address, the browser's user-agent
-- string and the month's salt), the first and the last day the code was seen, and the month.
-- No IP address, no page, no time of day. At the start of a month the salt is replaced and every
-- row of the month before is deleted, so a code cannot be followed from one month to the next
-- and cannot be recomputed afterwards.
-- Additive: no existing table changes.

CREATE TABLE IF NOT EXISTS metrics_daily (
  day  date    NOT NULL,
  kind text    NOT NULL,
  key  text    NOT NULL,
  n    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, key)
);

CREATE TABLE IF NOT EXISTS metrics_salt (
  month text NOT NULL PRIMARY KEY,   -- 'YYYY-MM'
  salt  text NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics_visitors (
  code      text NOT NULL PRIMARY KEY,
  month     text NOT NULL,
  first_day date NOT NULL,
  last_day  date NOT NULL
);
CREATE INDEX IF NOT EXISTS metrics_visitors_month_idx ON metrics_visitors (month);
