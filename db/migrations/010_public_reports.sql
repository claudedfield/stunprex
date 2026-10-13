-- 010: reports from anyone, not only signed-in members (LEGAL-03.2).
--
-- A report may now come from a visitor: reporter_id is optional, and a name and an email address
-- may be given "so that we can answer you". A report about the sexual abuse or exploitation of a
-- child may come with neither. The report carries the address of the item it is about. A
-- moderator's decision is recorded with its reason, and whether the outcome was mailed.
-- Additive and backward compatible: existing rows and the code now serving keep working.

ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS target_url      text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_name   text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_email  text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS child_safety    boolean NOT NULL DEFAULT false;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS good_faith_at   timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS decision        text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS decision_reason text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS outcome_sent_at timestamptz;

-- A report can also be about a page that is not a post ('other'); its address says which.
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE reports ADD CONSTRAINT reports_target_type_check
  CHECK (target_type IN ('question', 'answer', 'comment', 'user', 'other'));

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_decision_check;
ALTER TABLE reports ADD CONSTRAINT reports_decision_check
  CHECK (decision IS NULL OR decision IN ('hidden', 'removed', 'restricted', 'left'));
