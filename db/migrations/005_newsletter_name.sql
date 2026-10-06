-- D-NEWS-01 requirement 1, amended 28 Sep 2026 on the adviser's answer (Grt. 6. § (2)): the consent
-- statement carries the subscriber's name. Stored with the row; used only in the confirmation mail and
-- the issues. Additive and nullable (decision M): rows from before this release have none.
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name text;
