-- LEGAL-01a and LEGAL-01b (Legal seat, 24 Sep 2026): the terms version a member accepted and when,
-- and when they confirmed they are 16 or older. Additive and nullable (decision M): the code serving
-- before this release never reads these columns, and a member with nulls meets the terms step on
-- their next write.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_confirmed_at timestamptz;
