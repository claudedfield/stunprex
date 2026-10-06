-- LEGAL-01e, found 29 Sep 2026: submitReport writes reports.detail, which no migration created, so
-- every report failed with "column does not exist" (0 reports in production). Additive and nullable
-- (decision M). LEGAL-01e uses this column as the report's explanation.
ALTER TABLE reports ADD COLUMN IF NOT EXISTS detail text;
