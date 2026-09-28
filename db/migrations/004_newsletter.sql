-- D-NEWS-01 (owner decision 28 Sep 2026): StunpreX's own newsletter, sent from news@stunprex.com.
-- Additive (decision M): the code serving before this release only answers 410 on /api/newsletter
-- and never reads this table.

-- The table was created by hand in June; this makes a fresh database match.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email      text        NOT NULL UNIQUE,
  source     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirm_token text;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirm_token_expires_at timestamptz;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirm_sent_at timestamptz;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token text;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS consent_requested_at timestamptz;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS bounced_at timestamptz;

-- Decision G(iii) (D-LEGAL-02, gate row N7): the legacy rows, from the retired /api/newsletter,
-- are deleted before the table takes its new role. Every row this release writes has a status,
-- so on a re-run nothing more is deleted.
DELETE FROM newsletter_subscribers WHERE status IS NULL;

ALTER TABLE newsletter_subscribers ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE newsletter_subscribers ALTER COLUMN status SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_status_check') THEN
    ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_status_check
      CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'bounced'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_key ON newsletter_subscribers (confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_key ON newsletter_subscribers (unsubscribe_token);

-- One row per issue that has been sent (or previewed); the text itself lives in the repository.
CREATE TABLE IF NOT EXISTS newsletter_issues (
  id                 text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  number             integer     NOT NULL UNIQUE,
  slug               text        NOT NULL UNIQUE,
  subject            text        NOT NULL,
  list_started_at    timestamptz,
  list_finished_at   timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Every message: a list send names the subscriber; a preview names the internal address it went to.
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id            text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  issue_id      text        NOT NULL REFERENCES newsletter_issues(id),
  subscriber_id text        REFERENCES newsletter_subscribers(id),
  preview_to    text,
  kind          text        NOT NULL CHECK (kind IN ('preview', 'list')),
  result        text        NOT NULL,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  bounced_at    timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_sends_once ON newsletter_sends (issue_id, subscriber_id) WHERE kind = 'list';

-- Staging only: mail the staging site would have sent, captured instead of sent (the e2e reads it).
CREATE TABLE IF NOT EXISTS newsletter_test_outbox (
  id         text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  to_address text        NOT NULL,
  subject    text        NOT NULL,
  headers    jsonb       NOT NULL,
  text_body  text        NOT NULL,
  html_body  text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
