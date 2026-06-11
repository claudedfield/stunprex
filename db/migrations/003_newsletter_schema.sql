-- ============================================================
-- Migration 003 — Newsletter subscribers + issue send log
-- Run AFTER 001_auth_schema.sql (pgcrypto extension)
-- Idempotent: safe to run on every build (db/migrate.mjs).
--
-- Data minimisation by design: stores email + opaque tokens only.
-- No names, no IP addresses, no open/click tracking columns.
-- Double opt-in: status pending → confirmed; unsubscribed is terminal
-- until the address explicitly re-subscribes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── newsletter_subscribers ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email           text NOT NULL UNIQUE,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token   text UNIQUE,    -- double-opt-in link token
  unsub_token     text UNIQUE,    -- per-subscriber unsubscribe link token
  source          text,           -- where the signup came from (e.g. 'homepage', 'blog-footer')
  consent_at      timestamptz,    -- when the subscribe form was submitted
  confirmed_at    timestamptz,    -- when the confirm link was clicked
  unsubscribed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers (status);

-- ─── newsletter_issues ───────────────────────────────────────────────────────
-- Send log — one row per issue actually dispatched (scripts/send-newsletter.mjs).

CREATE TABLE IF NOT EXISTS newsletter_issues (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject         text NOT NULL,
  body_html       text,
  sent_at         timestamptz,
  recipient_count integer
);
