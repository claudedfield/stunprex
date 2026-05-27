-- ============================================================
-- Migration 001 — Auth.js v5 Postgres adapter tables
-- Run in: Vercel Postgres dashboard → SQL Editor (or vercel postgres CLI)
-- Run BEFORE 002_community_schema.sql (community references users.id)
-- Auth.js @auth/pg-adapter creates these automatically on first sign-in
-- IF the adapter's createTables() is called. This file is the manual
-- equivalent for Dezső to run upfront so the schema is correct from day one.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auth.js users table
CREATE TABLE IF NOT EXISTS users (
  id                text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name              text,
  email             text UNIQUE,
  "emailVerified"   timestamptz,
  image             text
);

-- Auth.js accounts table (OAuth providers)
CREATE TABLE IF NOT EXISTS accounts (
  id                    text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"              text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  text NOT NULL,
  provider              text NOT NULL,
  "providerAccountId"   text NOT NULL,
  refresh_token         text,
  access_token          text,
  expires_at            bigint,
  token_type            text,
  scope                 text,
  id_token              text,
  session_state         text,
  UNIQUE (provider, "providerAccountId")
);

-- Auth.js sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id             text NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionToken" text NOT NULL UNIQUE,
  "userId"       text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        timestamptz NOT NULL
);

-- Auth.js verification tokens (magic links)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier text NOT NULL,
  expires    timestamptz NOT NULL,
  token      text NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts ("userId");
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions ("userId");
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions ("sessionToken");
