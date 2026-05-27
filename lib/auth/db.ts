/**
 * Auth-adjacent DB helpers.
 * Handles profile auto-creation and session enrichment queries.
 * Used by auth.ts session callback and by server actions that need the current profile.
 */
import { sql } from '@/db'
import type { ProfileRow } from '@/lib/types/community'
import { generateDisplayName } from '@/lib/community/utils'

/**
 * Returns the profile for userId, creating a default one if it doesn't exist.
 * Called on every session read — must be fast. The INSERT is a no-op on conflict.
 *
 * Admin promotion: if the email matches any address in the comma-separated
 * ADMIN_EMAILS env var, the profile is created with role='admin'.
 * On conflict (returning user) the role is NOT downgraded — preserves manual promotions.
 */
export async function ensureProfile(userId: string, email: string): Promise<ProfileRow> {
  const displayName = generateDisplayName(email)

  // Determine role at profile creation time.
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const role: string = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user'

  const { rows } = await sql<ProfileRow>`
    INSERT INTO profiles (user_id, display_name, role, is_banned, wants_newsletter, onboarded)
    VALUES (
      ${userId},
      -- Derive display name from email local-part; append short id suffix if taken
      (SELECT COALESCE(
        CASE WHEN NOT EXISTS (
          SELECT 1 FROM profiles WHERE display_name = ${displayName}
        ) THEN ${displayName}
        ELSE ${displayName} || '-' || substr(${userId}, 1, 4)
        END
      )),
      ${role},
      false,
      false,
      false
    )
    ON CONFLICT (user_id) DO UPDATE SET user_id = profiles.user_id
    RETURNING *
  `

  return rows[0]
}

/**
 * Fetch the full profile for the given userId (must exist).
 * Returns null if not found.
 */
export async function getProfileById(userId: string): Promise<ProfileRow | null> {
  const { rows } = await sql<ProfileRow>`
    SELECT * FROM profiles WHERE user_id = ${userId} LIMIT 1
  `
  return rows[0] ?? null
}
