-- 011: the session choice (Legal 03.4) and the one-time address check for Google (Legal's C1).
--
-- sessions.keep: true when the person ticked "Keep me signed in on this device for 30 days"; the
-- session then lasts 30 days and its cookie is kept that long. False: the session ends 24 hours
-- after sign-in and its cookie is a session cookie, which the browser removes when it closes.
-- Sessions made before the choice existed were 30-day sessions and stay so.
--
-- google_pending: a Google sign-in for an address that is not Gmail or Google Workspace waits here
-- for at most 15 minutes, until the person types the code we email to that address. It is tied to
-- the browser that started it (a hash of the value in its sign-in cookie). Rows older than an hour
-- are deleted by the nightly clean-up.

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS keep boolean NOT NULL DEFAULT false;
UPDATE sessions SET keep = true;

CREATE TABLE IF NOT EXISTS google_pending (
  nonce_hash          text        PRIMARY KEY,
  email               text        NOT NULL,
  provider_account_id text        NOT NULL,
  next                text        NOT NULL DEFAULT '/community',
  created_at          timestamptz NOT NULL DEFAULT now()
);
