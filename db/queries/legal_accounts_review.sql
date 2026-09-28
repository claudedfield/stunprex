-- LEGAL-01b item 5: existing accounts, for the COO's one review once the age rule is live.
-- Read-only. It changes and deletes nothing. Its output goes to the COO and is never published.
-- Display name (not the email address), when the profile was created, how many posts, and whether
-- the member has accepted the current terms and confirmed their age yet.
SELECT
  p.display_name,
  p.created_at::date                                              AS created,
  (SELECT count(*) FROM questions q WHERE q.author_id = p.user_id) AS questions,
  (SELECT count(*) FROM answers   a WHERE a.author_id = p.user_id) AS answers,
  (SELECT count(*) FROM comments  c WHERE c.author_id = p.user_id) AS comments,
  p.terms_version,
  p.age_confirmed_at IS NOT NULL                                   AS age_confirmed
FROM profiles p
ORDER BY p.created_at;
