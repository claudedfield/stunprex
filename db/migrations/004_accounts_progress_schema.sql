-- ============================================================
-- Migration 004 — Accounts, parental consent, training progress
-- Run AFTER 001_auth_schema.sql (users table) — idempotent, safe on
-- every build (db/migrate.mjs).
--
-- NOTE on role: users has NO role column and none is added here.
-- Community role already lives on profiles.role (002_community_schema.sql)
-- — duplicating it on users would create two sources of truth.
--
-- Data minimisation by design:
--   - birth YEAR only (age gate), never full date of birth
--   - country_code only (consent-age rules), no geolocation
--   - no free-text health data fields anywhere
-- Design rationale: docs/data-architecture-minors.md
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users: profile columns ──────────────────────────────────────────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_type text
  CONSTRAINT users_profile_type_check
  CHECK (profile_type IN ('player', 'parent', 'coach') OR profile_type IS NULL);

ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year integer;   -- year only, never full DOB
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code text;    -- ISO 3166-1 alpha-2, for consent-age rules

-- ─── parent_player_links ─────────────────────────────────────────────────────
-- Parent-anchor model: a parent account creates/approves a sub-consent-age
-- player account. The link is the consent relationship.

CREATE TABLE IF NOT EXISTS parent_player_links (
  id                 text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  parent_user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'active', 'revoked')),
  consent_granted_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, player_user_id)
);

CREATE INDEX IF NOT EXISTS parent_player_links_player_idx ON parent_player_links (player_user_id);

-- ─── consent_records ─────────────────────────────────────────────────────────
-- Append-only audit of who consented to what, under which policy version.
-- For 'parental', granted_by_user_id is the parent granting on the player's behalf.

CREATE TABLE IF NOT EXISTS consent_records (
  id                 text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id            text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type       text NOT NULL
                       CHECK (consent_type IN ('terms', 'privacy', 'parental')),
  granted_by_user_id text REFERENCES users(id),
  policy_version     text,
  granted_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consent_records_user_idx ON consent_records (user_id);

-- ─── training_sessions ───────────────────────────────────────────────────────
-- One row per logged session. activity_type follows the Activity-Capacity
-- Matrix categories; capacity_tags carry the six capacity families
-- (Perceptual, Cognitive, Motor, Communication, Affective, Adaptive).
-- metrics is a flexible jsonb bag (touches, scans, weak-foot reps, …) —
-- leading indicators, never a verdict.

CREATE TABLE IF NOT EXISTS training_sessions (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  player_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date   date NOT NULL,
  activity_type  text
                   CHECK (activity_type IN (
                     'organised', 'ssg', 'match', 'futsal',
                     'free', 'solo', 'video', 'mental'
                   )),
  duration_min   integer,
  capacity_tags  text[],
  metrics        jsonb NOT NULL DEFAULT '{}'::jsonb,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_sessions_player_date_idx
  ON training_sessions (player_user_id, session_date DESC);

-- ─── progression_events ──────────────────────────────────────────────────────
-- Milestones and notable moments on the long horizon (first weak-foot goal,
-- new position rotated into, streak reached, …). payload is event-shaped jsonb.

CREATE TABLE IF NOT EXISTS progression_events (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  player_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS progression_events_player_idx
  ON progression_events (player_user_id, occurred_at DESC);
