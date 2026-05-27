-- ============================================================
-- Migration 002 — StunpreX Community Q&A schema
-- Run AFTER 001_auth_schema.sql (references users.id)
-- Stack: Vercel Postgres (no RLS — authorization enforced in app code)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  user_id          text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name     text NOT NULL UNIQUE
                     CONSTRAINT display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 40),
  bio              text
                     CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 280),
  avatar_url       text
                     CONSTRAINT avatar_https CHECK (avatar_url IS NULL OR avatar_url LIKE 'https://%'),
  role             text NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'moderator', 'admin')),
  is_banned        boolean NOT NULL DEFAULT false,
  wants_newsletter boolean NOT NULL DEFAULT false,
  onboarded        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON profiles (display_name);

-- ─── questions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS questions (
  id                 text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id          text NOT NULL REFERENCES users(id),
  title              text NOT NULL
                       CONSTRAINT title_length CHECK (char_length(title) BETWEEN 10 AND 200),
  slug               text NOT NULL UNIQUE,
  body               text NOT NULL
                       CONSTRAINT body_not_empty CHECK (char_length(trim(body)) > 0),
  category           text NOT NULL
                       CHECK (category IN (
                         'methodology', 'player-development', 'coaching',
                         'parent-corner', 'pro-breakdown', 'wins-showcase', 'general'
                       )),
  audience_layer     text
                       CHECK (audience_layer IS NULL OR audience_layer IN ('Player','Parent','Coach','Halo')),
  status             text NOT NULL DEFAULT 'published'
                       CHECK (status IN ('published', 'hidden', 'deleted')),
  accepted_answer_id text,   -- FK added after answers table creation below
  upvote_count       integer NOT NULL DEFAULT 0,
  answer_count       integer NOT NULL DEFAULT 0,
  view_count         integer NOT NULL DEFAULT 0,
  is_pinned          boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questions_category_created_idx ON questions (category, created_at DESC);
CREATE INDEX IF NOT EXISTS questions_slug_idx           ON questions (slug);
CREATE INDEX IF NOT EXISTS questions_author_id_idx      ON questions (author_id);
CREATE INDEX IF NOT EXISTS questions_status_idx         ON questions (status);
CREATE INDEX IF NOT EXISTS questions_top_idx            ON questions (upvote_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS questions_pinned_idx         ON questions (is_pinned DESC, created_at DESC)
  WHERE is_pinned = true;

-- ─── answers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS answers (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id  text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id    text NOT NULL REFERENCES users(id),
  body         text NOT NULL
                 CONSTRAINT answer_body_not_empty CHECK (char_length(trim(body)) > 0),
  status       text NOT NULL DEFAULT 'published'
                 CHECK (status IN ('published', 'hidden', 'deleted')),
  upvote_count integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS answers_question_id_votes_idx ON answers (question_id, upvote_count DESC);
CREATE INDEX IF NOT EXISTS answers_author_id_idx         ON answers (author_id);

-- Now add the FK from questions.accepted_answer_id → answers.id
ALTER TABLE questions
  ADD CONSTRAINT fk_accepted_answer
  FOREIGN KEY (accepted_answer_id) REFERENCES answers(id) ON DELETE SET NULL
  NOT VALID;   -- NOT VALID to skip full table scan; validate separately if needed

-- ─── comments ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  target_type text NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id   text NOT NULL,
  author_id   text NOT NULL REFERENCES users(id),
  body        text NOT NULL
                CONSTRAINT comment_length CHECK (char_length(trim(body)) BETWEEN 1 AND 600),
  status      text NOT NULL DEFAULT 'published'
                CHECK (status IN ('published', 'hidden', 'deleted')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_target_idx     ON comments (target_type, target_id, created_at);
CREATE INDEX IF NOT EXISTS comments_author_id_idx  ON comments (author_id);

-- ─── upvotes ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS upvotes (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS upvotes_target_idx ON upvotes (target_type, target_id);

-- ─── tags ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tags (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug        text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS question_tags (
  question_id text NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id      text NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, tag_id)
);

CREATE INDEX IF NOT EXISTS question_tags_tag_id_idx ON question_tags (tag_id);

-- ─── reports ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id           text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reporter_id  text NOT NULL REFERENCES users(id),
  target_type  text NOT NULL CHECK (target_type IN ('question', 'answer', 'comment', 'user')),
  target_id    text NOT NULL,
  reason       text NOT NULL
                 CONSTRAINT reason_not_empty CHECK (char_length(trim(reason)) > 0),
  status       text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by  text REFERENCES users(id),
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status, created_at DESC);

-- ─── Triggers: updated_at ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Triggers: cached counts ─────────────────────────────────────────────────

-- Maintain questions.answer_count
CREATE OR REPLACE FUNCTION sync_answer_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'published' AND NEW.status != 'published' THEN
      UPDATE questions SET answer_count = GREATEST(0, answer_count - 1) WHERE id = NEW.question_id;
    ELSIF OLD.status != 'published' AND NEW.status = 'published' THEN
      UPDATE questions SET answer_count = answer_count + 1 WHERE id = NEW.question_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'published' THEN
    UPDATE questions SET answer_count = GREATEST(0, answer_count - 1) WHERE id = OLD.question_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER answers_answer_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION sync_answer_count();

-- Maintain upvote_count on questions and answers
CREATE OR REPLACE FUNCTION sync_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'question' THEN
      UPDATE questions SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
    ELSE
      UPDATE answers SET upvote_count = upvote_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'question' THEN
      UPDATE questions SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.target_id;
    ELSE
      UPDATE answers SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER upvotes_sync_count
  AFTER INSERT OR DELETE ON upvotes
  FOR EACH ROW EXECUTE FUNCTION sync_upvote_count();

-- ─── Seed: tags (§5 brief) ───────────────────────────────────────────────────

INSERT INTO tags (slug, label) VALUES
  ('player', 'Player'), ('parent', 'Parent'), ('coach', 'Coach'), ('halo', 'Halo'),
  ('u8', 'U8'), ('u10', 'U10'), ('u13', 'U13'), ('u16', 'U16'), ('u20', 'U20'), ('senior', 'Senior'),
  ('first-touch', 'First touch'), ('scanning', 'Scanning'), ('weak-foot', 'Weak foot'),
  ('dribbling', 'Dribbling'), ('passing', 'Passing'), ('shooting', 'Shooting'),
  ('defending', 'Defending'), ('tactical', 'Tactical'), ('mental', 'Mental'),
  ('nutrition', 'Nutrition'), ('recovery', 'Recovery'), ('academy', 'Academy'),
  ('deselection', 'Deselection'), ('goalkeeping', 'Goalkeeping'),
  ('drill-design', 'Drill design'), ('solo-practice', 'Solo practice'),
  ('small-sided', 'Small-sided'), ('match-prep', 'Match prep')
ON CONFLICT (slug) DO NOTHING;

-- ─── Post-setup instructions ─────────────────────────────────────────────────
-- EN5: After first sign-in via the community UI, promote Dezső to admin:
--   UPDATE profiles SET role = 'admin' WHERE user_id = (
--     SELECT id FROM users WHERE email = 'dfield.bt@gmail.com'
--   );
--
-- EN8: After EN5, create the welcome question from Dezső's admin account via
--   the UI, or run the seed INSERT below (replace $DEZSO_USER_ID):
--
--   INSERT INTO questions (author_id, title, slug, body, category, is_pinned)
--   VALUES (
--     '$DEZSO_USER_ID',
--     'Welcome to StunpreX Community — introduce yourself',
--     'welcome-to-stunprex-community-introduce-yourself',
--     'Welcome. This is a space for players, parents, coaches, and everyone interested in individual football development done right.
--
-- Start here: tell us who you are, where you''re coming from, and what question brought you to StunpreX.',
--     'general',
--     true
--   );
