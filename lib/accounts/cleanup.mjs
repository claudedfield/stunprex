/**
 * LEGAL-03.14: the unfinished sign-up clean-up. Run daily on the VPS with the newsletter clean-ups
 * (`newsletter-send.mjs cleanup`).
 *
 * An unfinished sign-up is an account whose holder opened a sign-in link but never accepted the
 * terms and confirmed their age. It has no public profile page and no community rights, and it is
 * deleted 30 days after its last sign-in. Auth.js sets users."emailVerified" at every sign-in by
 * link, so that column is the last sign-in.
 *
 * Deleting the users row takes the profile, sessions and provider links with it (ON DELETE CASCADE);
 * unused sign-in links for the address are deleted beside it. An account that somehow holds a post
 * or a report is left alone: it is not an unfinished sign-up, and erase_member (03.6) is its route.
 * Returns a count only; no row is read out.
 */
export const UNFINISHED_DAYS = 30

export async function cleanupUnfinishedAccounts(query) {
  const r = await query(
    `WITH gone AS (
       DELETE FROM users u
       USING profiles p
       WHERE p.user_id = u.id
         AND (p.terms_accepted_at IS NULL OR p.age_confirmed_at IS NULL)
         AND COALESCE(u."emailVerified", p.created_at) < now() - make_interval(days => $1)
         AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.author_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM answers a WHERE a.author_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM comments c WHERE c.author_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM reports r WHERE r.reporter_id = u.id OR r.reviewed_by = u.id)
       RETURNING u.email
     ), links AS (
       DELETE FROM verification_tokens v USING gone WHERE v.identifier = gone.email
     )
     SELECT count(*)::int AS n FROM gone`, [UNFINISHED_DAYS])
  return { unfinished_deleted: r.rows[0]?.n ?? 0 }
}
