-- ============================================================
-- StunpreX Community — Database Schema v1
-- Migration: 001_community_schema.sql
--
-- Run in Supabase SQL Editor (Project → SQL Editor → New query).
-- Prerequisites: Supabase Auth enabled (auth.users table exists).
-- COO decisions applied:
--   Q1  — Supabase + @supabase/ssr
--   Q2  — 👍 reaction (single reaction per user per target)
--   Q3  — Magic-link + Google OAuth (no password at v1)
--   Q4  — Markdown with rehype-sanitize whitelist (DB stores raw markdown)
--   Q5  — Anonymous reading (RLS: anon can SELECT published posts/comments)
--   Q10 — Manual admin seeding via SQL (see bottom of file)
--   Q12 — image_url on posts only, HTTPS + domain validation in application layer
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE post_category AS ENUM (
  'methodology',
  'coaching',
  'player-development',
  'parent-corner',
  'general'
);
CREATE TYPE content_status AS ENUM ('published', 'hidden', 'deleted');
CREATE TYPE reaction_target_type AS ENUM ('post', 'comment');
CREATE TYPE report_target_type AS ENUM ('post', 'comment', 'user');
CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'actioned', 'dismissed');

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Extends auth.users with community-specific fields.
-- id mirrors auth.users.id (UUID) — one row per user.

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  display_name  TEXT NOT NULL UNIQUE,
  bio           TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Auto-create profile row on auth.users insert (triggered by Supabase Auth sign-up)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Default display_name: email local-part (before @), truncated to 30 chars
    LOWER(SUBSTRING(NEW.email FROM 1 FOR POSITION('@' IN NEW.email) - 1)),
    30
  );
  -- Note: display_name uniqueness constraint will trigger a conflict if two
  -- users share the same email local-part. Application layer should handle
  -- this by appending a suffix (e.g. username_2) on conflict.
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Append first 4 chars of UUID to resolve display_name collision
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    LOWER(SUBSTRING(NEW.email FROM 1 FOR POSITION('@' IN NEW.email) - 1))
      || '_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 4)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── posts ────────────────────────────────────────────────────────────────────

CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 200),
  slug            TEXT NOT NULL UNIQUE,
  body            TEXT NOT NULL,
  category        post_category NOT NULL,
  status          content_status NOT NULL DEFAULT 'published',
  image_url       TEXT,             -- optional; HTTPS + domain whitelist enforced in app layer
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reaction_count  INTEGER NOT NULL DEFAULT 0 CHECK (reaction_count >= 0)
);

-- Slug generation helper: convert title to kebab-case slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := LOWER(title);
  slug := REGEXP_REPLACE(slug, '[^a-z0-9\s-]', '', 'g');  -- strip non-alphanumeric
  slug := REGEXP_REPLACE(slug, '\s+', '-', 'g');            -- spaces → hyphens
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');             -- collapse multiple hyphens
  slug := TRIM(BOTH '-' FROM slug);                         -- strip leading/trailing hyphens
  RETURN slug;
END;
$$;

-- Auto-update updated_at on posts row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);

-- ─── comments ────────────────────────────────────────────────────────────────
-- One level of nesting: post → comment → reply (reply has parent_comment_id set).
-- reply-to-reply is blocked at application layer (not schema-enforced here to
-- keep the constraint readable; add a CHECK in v2 if needed).

CREATE TABLE comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body               TEXT NOT NULL,
  status             content_status NOT NULL DEFAULT 'published',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_status ON comments(status);

-- ─── reactions ───────────────────────────────────────────────────────────────
-- Single 👍 per user per target. UNIQUE constraint enforces one-reaction-per-user.
-- reaction_count on posts cached via trigger for fast reads.

CREATE TABLE reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  reaction_target_type NOT NULL,
  target_id    UUID NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_user ON reactions(user_id);

-- Maintain posts.reaction_count cache when reactions are added/removed
CREATE OR REPLACE FUNCTION update_post_reaction_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.target_type = 'post') THEN
    UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.target_type = 'post') THEN
    UPDATE posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER reactions_update_post_count
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- ─── reports ─────────────────────────────────────────────────────────────────

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  report_target_type NOT NULL,
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  status       report_status NOT NULL DEFAULT 'open',
  reviewed_by  UUID REFERENCES profiles(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- ─── Row-Level Security ──────────────────────────────────────────────────────
-- COO Q5: anonymous reading enabled — anon key can SELECT published content.
-- Auth state is determined by auth.uid() (NULL for anon, UUID for authenticated).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read (public display_name, avatar for comment threads)
-- only the profile owner can update their own row; admin can update any row
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- posts: anyone can read published posts; author/moderator/admin can see hidden/deleted
CREATE POLICY "posts_select_published"
  ON posts FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "posts_insert_authenticated"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "posts_update_own_or_mod"
  ON posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "posts_delete_own_or_mod"
  ON posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- comments: same shape as posts
CREATE POLICY "comments_select_published"
  ON comments FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "comments_update_own_or_mod"
  ON comments FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "comments_delete_own_or_mod"
  ON comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- reactions: anyone can read counts; only authenticated non-banned users can react
CREATE POLICY "reactions_select_public"
  ON reactions FOR SELECT USING (TRUE);

CREATE POLICY "reactions_insert_authenticated"
  ON reactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- reports: authenticated users can insert; only moderators/admins can read/update
CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = reporter_id
    AND NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

CREATE POLICY "reports_select_mod_admin"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "reports_update_mod_admin"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- ─── Seeding (run AFTER Dezső's first sign-up via community UI) ───────────────
--
-- Step 1 — Promote Dezső to admin (run once, after his first sign-up):
-- UPDATE profiles SET role = 'admin' WHERE email = 'dfield.bt@gmail.com';
--
-- Step 2 — Seed welcome post (run once, after Step 1):
-- The author_id must be Dezső's profile UUID. Get it with:
--   SELECT id FROM profiles WHERE email = 'dfield.bt@gmail.com';
-- Then substitute below:
--
-- INSERT INTO posts (author_id, title, slug, body, category, status)
-- VALUES (
--   '<dezso-profile-uuid>',
--   'Welcome to the StunpreX Community',
--   'welcome-to-the-stunprex-community',
--   E'# Welcome\n\nThis is a space for players, parents, coaches, and anyone who cares about football development done right.\n\nPost questions, share observations, start conversations. Methodology debates welcome. The only rule is the same as on the pitch: respect the process and respect the person.\n\n— StunpreX',
--   'general',
--   'published'
-- );
--
-- ─── End of migration ─────────────────────────────────────────────────────────
