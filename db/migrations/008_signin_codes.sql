-- 008: sign-in by a six-digit code or a link that needs one press (D-AUTH-02).
--
-- One row per sign-in mail. It holds the address, a hash of the code, a hash of the link's token,
-- and Auth.js's own callback address, encrypted. Auth.js's token is long and random and is never
-- mailed, so a sign-in can only be finished through the two redeem steps, which count attempts.
-- A row is kept for 24 hours, because the mailbox's sending budget is counted over 24 hours, and
-- is then deleted (at the next sign-in request, and by the daily clean-up).
-- Additive: no existing table changes.

CREATE TABLE IF NOT EXISTS signin_codes (
  id           text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email        text        NOT NULL,
  code_hash    text        NOT NULL,
  link_hash    text        NOT NULL UNIQUE,
  callback_enc text        NOT NULL,
  attempts     integer     NOT NULL DEFAULT 0,
  used_at      timestamptz,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signin_codes_email_idx ON signin_codes (email, created_at);
CREATE INDEX IF NOT EXISTS signin_codes_created_idx ON signin_codes (created_at);
