'use server'
/**
 * Server Actions for community mutations.
 * Auth via Auth.js v5 `auth()` — checks session.user.id, .role, .is_banned.
 * Input validation via Zod before any DB write.
 * DB writes via Vercel Postgres `sql` tagged template.
 * Three-persona auth model: authenticated → not banned → role gate (mod/admin only).
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut as authSignOut, auth } from '@/auth'
import { sql } from '@/db'
import { z } from 'zod'
import { generateSlugFromTitle, sanitizeImageUrl, isEffectivelyEmpty, countExternalLinks } from '@/lib/community/utils'
import type { QuestionCategory } from '@/lib/types/community'

// ─── Shared result type ───────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ─── Validation schemas ───────────────────────────────────────────────────────

const QUESTION_CATEGORIES: [QuestionCategory, ...QuestionCategory[]] = [
  'methodology',
  'player-development',
  'coaching',
  'parent-corner',
  'pro-breakdown',
  'wins-showcase',
  'general',
]

const QuestionSchema = z.object({
  title: z
    .string()
    .min(15, 'Title must be at least 15 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  body: z
    .string()
    .min(30, 'Question body must be at least 30 characters')
    .max(50_000, 'Question body must be 50,000 characters or fewer'),
  category: z.enum(QUESTION_CATEGORIES),
  tag_ids: z.array(z.string().uuid()).max(5, 'You can add at most 5 tags').default([]),
})

const AnswerSchema = z.object({
  body: z
    .string()
    .min(30, 'Answer must be at least 30 characters')
    .max(50_000, 'Answer must be 50,000 characters or fewer'),
  question_id: z.string().uuid(),
})

const CommentSchema = z.object({
  body: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2_000, 'Comment must be 2,000 characters or fewer'),
  target_type: z.enum(['question', 'answer'] as const),
  target_id: z.string().uuid(),
})

const ReportSchema = z.object({
  target_type: z.enum(['question', 'answer', 'comment', 'user'] as const),
  target_id: z.string().uuid(),
  reason: z.enum(['spam', 'misinformation', 'harmful', 'off-topic', 'other'] as const),
  detail: z.string().max(500).optional(),
})

const ProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be 30 characters or fewer')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Display name can only contain letters, numbers, underscores, and hyphens'
    ),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer').optional(),
  avatar_url: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal('')),
})

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Get session and verify user is authenticated + not banned. Returns error string or null. */
async function requireAuth(): Promise<
  { ok: true; userId: string; role: string } | { ok: false; error: string }
> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'You must be signed in.' }
  const u = session.user as typeof session.user & { is_banned?: boolean; role?: string }
  if (u.is_banned) return { ok: false, error: 'Your account cannot perform this action.' }
  return { ok: true, userId: session.user.id, role: u.role ?? 'user' }
}

/** Require moderator or admin role. */
async function requireMod(): Promise<
  { ok: true; userId: string; role: string } | { ok: false; error: string }
> {
  const result = await requireAuth()
  if (!result.ok) return result
  if (result.role !== 'moderator' && result.role !== 'admin') {
    return { ok: false, error: 'Insufficient permissions.' }
  }
  return result
}

/** Generate a unique slug for a question, appending numeric suffixes on collision. */
async function uniqueQuestionSlug(title: string): Promise<string> {
  const base = generateSlugFromTitle(title)
  let slug = base
  for (let i = 1; i <= 20; i++) {
    const { rows } = await sql<{ id: string }>`
      SELECT id FROM questions WHERE slug = ${slug} LIMIT 1
    `
    if (rows.length === 0) return slug
    slug = `${base}-${i}`
  }
  // Fallback: append timestamp fragment
  return `${base}-${Date.now().toString(36)}`
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

/**
 * Send a magic-link sign-in email via Auth.js.
 * Returns an error message or success flag — never throws to the client.
 */
export async function signInWithMagicLink(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const email = (formData.get('email') as string | null)?.trim()
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    await signIn('email', { email, redirect: false })
    return {
      success: true,
      data: { message: "Check your email — we've sent you a sign-in link." },
    }
  } catch (err) {
    console.error('[signInWithMagicLink]', err)
    return { success: false, error: 'Could not send sign-in link. Please try again.' }
  }
}

/** Sign out the current user and redirect to home. */
export async function signOut() {
  await authSignOut()
  redirect('/')
}

/** Mark the current user's profile as onboarded (called from /community/welcome). */
export async function completeOnboarding(): Promise<ActionResult> {
  const result = await requireAuth()
  if (!result.ok) return { success: false, error: result.error }

  await sql`
    UPDATE profiles SET onboarded = true WHERE user_id = ${result.userId}
  `

  revalidatePath('/community')
  redirect('/community')
}

// ─── Question actions ─────────────────────────────────────────────────────────

export async function createQuestion(
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const rawTagIds = formData.getAll('tag_ids') as string[]
  const raw = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    category: formData.get('category') as QuestionCategory,
    tag_ids: rawTagIds,
  }

  const parsed = QuestionSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { title, body, category, tag_ids } = parsed.data

  if (isEffectivelyEmpty(body)) {
    return { success: false, error: 'Question body cannot be empty.' }
  }
  if (countExternalLinks(body) >= 3) {
    return {
      success: false,
      error: 'Questions with 3 or more external links are blocked. Please reduce the number of links.',
    }
  }

  const slug = await uniqueQuestionSlug(title)

  const { rows } = await sql<{ id: string; slug: string }>`
    INSERT INTO questions (author_id, title, slug, body, category, status)
    VALUES (${authResult.userId}, ${title}, ${slug}, ${body}, ${category}, 'published')
    RETURNING id, slug
  `
  const question = rows[0]

  // Insert tag associations
  if (tag_ids.length > 0) {
    for (const tagId of tag_ids) {
      await sql`
        INSERT INTO question_tags (question_id, tag_id)
        VALUES (${question.id}, ${tagId})
        ON CONFLICT DO NOTHING
      `
    }
    // Update tag question_counts
    await sql.query(
      `UPDATE tags SET question_count = question_count + 1 WHERE id = ANY($1::uuid[])`,
      [tag_ids]
    )
  }

  revalidatePath('/community')
  return { success: true, data: { slug: question.slug } }
}

export async function updateQuestion(
  questionId: string,
  formData: FormData
): Promise<ActionResult<{ slug: string }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  // Ownership check
  const { rows: ownerRows } = await sql<{ author_id: string; slug: string }>`
    SELECT author_id, slug FROM questions WHERE id = ${questionId} AND status != 'deleted' LIMIT 1
  `
  if (ownerRows.length === 0) return { success: false, error: 'Question not found.' }
  const { author_id, slug } = ownerRows[0]

  if (author_id !== authResult.userId && authResult.role !== 'moderator' && authResult.role !== 'admin') {
    return { success: false, error: 'You can only edit your own questions.' }
  }

  const rawTagIds = formData.getAll('tag_ids') as string[]
  const raw = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    category: formData.get('category') as QuestionCategory,
    tag_ids: rawTagIds,
  }

  const parsed = QuestionSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { title, body, category, tag_ids } = parsed.data

  // Slug may change if title changes
  const newSlug = generateSlugFromTitle(title)
  const finalSlug = newSlug !== slug ? await uniqueQuestionSlug(title) : slug

  await sql`
    UPDATE questions
    SET title = ${title}, slug = ${finalSlug}, body = ${body}, category = ${category}
    WHERE id = ${questionId}
  `

  // Re-sync tags: delete existing, re-insert
  const { rows: oldTags } = await sql<{ tag_id: string }>`
    SELECT tag_id FROM question_tags WHERE question_id = ${questionId}
  `
  const oldTagIds = oldTags.map((r) => r.tag_id)

  await sql`DELETE FROM question_tags WHERE question_id = ${questionId}`

  // Decrement old tag counts
  if (oldTagIds.length > 0) {
    await sql.query(
      `UPDATE tags SET question_count = GREATEST(0, question_count - 1) WHERE id = ANY($1::uuid[])`,
      [oldTagIds]
    )
  }

  // Insert new tags
  if (tag_ids.length > 0) {
    for (const tagId of tag_ids) {
      await sql`
        INSERT INTO question_tags (question_id, tag_id)
        VALUES (${questionId}, ${tagId})
        ON CONFLICT DO NOTHING
      `
    }
    await sql.query(
      `UPDATE tags SET question_count = question_count + 1 WHERE id = ANY($1::uuid[])`,
      [tag_ids]
    )
  }

  revalidatePath(`/community/${finalSlug}`)
  revalidatePath('/community')
  return { success: true, data: { slug: finalSlug } }
}

export async function deleteQuestion(questionId: string, slug: string): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ author_id: string }>`
    SELECT author_id FROM questions WHERE id = ${questionId} AND status != 'deleted' LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'Question not found.' }

  if (rows[0].author_id !== authResult.userId && authResult.role !== 'moderator' && authResult.role !== 'admin') {
    return { success: false, error: 'You can only delete your own questions.' }
  }

  await sql`UPDATE questions SET status = 'deleted' WHERE id = ${questionId}`

  revalidatePath('/community')
  return { success: true }
}

// ─── Answer actions ───────────────────────────────────────────────────────────

export async function createAnswer(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const raw = {
    body: formData.get('body') as string,
    question_id: formData.get('question_id') as string,
  }

  const parsed = AnswerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  if (isEffectivelyEmpty(parsed.data.body)) {
    return { success: false, error: 'Answer body cannot be empty.' }
  }

  // Verify question exists
  const { rows: qRows } = await sql<{ slug: string }>`
    SELECT slug FROM questions WHERE id = ${parsed.data.question_id} AND status = 'published' LIMIT 1
  `
  if (qRows.length === 0) return { success: false, error: 'Question not found.' }

  const { rows } = await sql<{ id: string }>`
    INSERT INTO answers (question_id, author_id, body, status)
    VALUES (${parsed.data.question_id}, ${authResult.userId}, ${parsed.data.body}, 'published')
    RETURNING id
  `

  revalidatePath(`/community/${qRows[0].slug}`)
  return { success: true, data: { id: rows[0].id } }
}

export async function updateAnswer(
  answerId: string,
  formData: FormData
): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ author_id: string; question_id: string }>`
    SELECT author_id, question_id FROM answers WHERE id = ${answerId} AND status != 'deleted' LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'Answer not found.' }

  if (rows[0].author_id !== authResult.userId && authResult.role !== 'moderator' && authResult.role !== 'admin') {
    return { success: false, error: 'You can only edit your own answers.' }
  }

  const body = formData.get('body') as string
  const parsed = AnswerSchema.safeParse({ body, question_id: rows[0].question_id })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error.' }
  }

  await sql`UPDATE answers SET body = ${body} WHERE id = ${answerId}`

  // Get slug for revalidation
  const { rows: qRows } = await sql<{ slug: string }>`
    SELECT slug FROM questions WHERE id = ${rows[0].question_id} LIMIT 1
  `
  if (qRows.length > 0) revalidatePath(`/community/${qRows[0].slug}`)
  return { success: true }
}

export async function deleteAnswer(answerId: string): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ author_id: string; question_id: string }>`
    SELECT author_id, question_id FROM answers WHERE id = ${answerId} AND status != 'deleted' LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'Answer not found.' }

  if (rows[0].author_id !== authResult.userId && authResult.role !== 'moderator' && authResult.role !== 'admin') {
    return { success: false, error: 'You can only delete your own answers.' }
  }

  await sql`UPDATE answers SET status = 'deleted' WHERE id = ${answerId}`

  const { rows: qRows } = await sql<{ slug: string }>`
    SELECT slug FROM questions WHERE id = ${rows[0].question_id} LIMIT 1
  `
  if (qRows.length > 0) revalidatePath(`/community/${qRows[0].slug}`)
  return { success: true }
}

/** Mark an answer as accepted. Only the question author can do this. */
export async function acceptAnswer(
  questionId: string,
  answerId: string
): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ author_id: string; slug: string }>`
    SELECT author_id, slug FROM questions WHERE id = ${questionId} AND status = 'published' LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'Question not found.' }
  if (rows[0].author_id !== authResult.userId) {
    return { success: false, error: 'Only the question author can accept an answer.' }
  }

  await sql`
    UPDATE questions SET accepted_answer_id = ${answerId} WHERE id = ${questionId}
  `

  revalidatePath(`/community/${rows[0].slug}`)
  return { success: true }
}

// ─── Comment actions ──────────────────────────────────────────────────────────

export async function createComment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const raw = {
    body: formData.get('body') as string,
    target_type: formData.get('target_type') as string,
    target_id: formData.get('target_id') as string,
  }

  const parsed = CommentSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { rows } = await sql<{ id: string }>`
    INSERT INTO comments (author_id, target_type, target_id, body, status)
    VALUES (${authResult.userId}, ${parsed.data.target_type}, ${parsed.data.target_id}, ${parsed.data.body}, 'published')
    RETURNING id
  `

  // Revalidate parent question page
  if (parsed.data.target_type === 'question') {
    const { rows: qRows } = await sql<{ slug: string }>`
      SELECT slug FROM questions WHERE id = ${parsed.data.target_id} LIMIT 1
    `
    if (qRows.length > 0) revalidatePath(`/community/${qRows[0].slug}`)
  } else {
    const { rows: aRows } = await sql<{ question_id: string }>`
      SELECT question_id FROM answers WHERE id = ${parsed.data.target_id} LIMIT 1
    `
    if (aRows.length > 0) {
      const { rows: qRows } = await sql<{ slug: string }>`
        SELECT slug FROM questions WHERE id = ${aRows[0].question_id} LIMIT 1
      `
      if (qRows.length > 0) revalidatePath(`/community/${qRows[0].slug}`)
    }
  }

  return { success: true, data: { id: rows[0].id } }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ author_id: string }>`
    SELECT author_id FROM comments WHERE id = ${commentId} AND status != 'deleted' LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'Comment not found.' }

  if (rows[0].author_id !== authResult.userId && authResult.role !== 'moderator' && authResult.role !== 'admin') {
    return { success: false, error: 'You can only delete your own comments.' }
  }

  await sql`UPDATE comments SET status = 'deleted' WHERE id = ${commentId}`
  revalidatePath('/community')
  return { success: true }
}

// ─── Upvote actions ───────────────────────────────────────────────────────────

/**
 * Toggle upvote on a question or answer.
 * Returns the new state: upvoted true/false + updated count.
 */
export async function toggleUpvote(
  targetType: 'question' | 'answer',
  targetId: string
): Promise<ActionResult<{ upvoted: boolean; count: number }>> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  // Check existing
  const { rows: existing } = await sql<{ id: string }>`
    SELECT id FROM upvotes
    WHERE user_id = ${authResult.userId}
      AND target_type = ${targetType}
      AND target_id = ${targetId}
    LIMIT 1
  `

  if (existing.length > 0) {
    // Remove upvote
    await sql`
      DELETE FROM upvotes WHERE id = ${existing[0].id}
    `
  } else {
    // Add upvote — ON CONFLICT = idempotent on race condition
    await sql`
      INSERT INTO upvotes (user_id, target_type, target_id)
      VALUES (${authResult.userId}, ${targetType}, ${targetId})
      ON CONFLICT (user_id, target_type, target_id) DO NOTHING
    `
  }

  // Read current count (trigger keeps it in sync)
  let count = 0
  if (targetType === 'question') {
    const { rows } = await sql<{ upvote_count: number }>`
      SELECT upvote_count FROM questions WHERE id = ${targetId} LIMIT 1
    `
    count = rows[0]?.upvote_count ?? 0
  } else {
    const { rows } = await sql<{ upvote_count: number }>`
      SELECT upvote_count FROM answers WHERE id = ${targetId} LIMIT 1
    `
    count = rows[0]?.upvote_count ?? 0
  }

  revalidatePath('/community')
  return { success: true, data: { upvoted: existing.length === 0, count } }
}

// ─── Report actions ───────────────────────────────────────────────────────────

export async function submitReport(formData: FormData): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const raw = {
    target_type: formData.get('target_type') as string,
    target_id: formData.get('target_id') as string,
    reason: formData.get('reason') as string,
    detail: (formData.get('detail') as string) || undefined,
  }

  const parsed = ReportSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Prevent duplicate reports from same user on same target
  const { rows: dup } = await sql<{ id: string }>`
    SELECT id FROM reports
    WHERE reporter_id = ${authResult.userId}
      AND target_type = ${parsed.data.target_type}
      AND target_id = ${parsed.data.target_id}
      AND status = 'open'
    LIMIT 1
  `
  if (dup.length > 0) {
    return { success: false, error: 'You have already reported this content.' }
  }

  await sql`
    INSERT INTO reports (reporter_id, target_type, target_id, reason, detail)
    VALUES (${authResult.userId}, ${parsed.data.target_type}, ${parsed.data.target_id}, ${parsed.data.reason}, ${parsed.data.detail ?? null})
  `

  return { success: true }
}

// ─── Profile actions ──────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const authResult = await requireAuth()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const avatarUrlRaw = (formData.get('avatar_url') as string) || ''
  const raw = {
    display_name: formData.get('display_name') as string,
    bio: (formData.get('bio') as string) || undefined,
    avatar_url: avatarUrlRaw || undefined,
  }

  const parsed = ProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Sanitize avatar URL if provided
  let avatarUrl: string | null = null
  if (parsed.data.avatar_url) {
    avatarUrl = sanitizeImageUrl(parsed.data.avatar_url)
    if (!avatarUrl) {
      return {
        success: false,
        error: 'Avatar URL must be HTTPS and from an allowed hosting service.',
      }
    }
  }

  try {
    await sql`
      UPDATE profiles
      SET
        display_name = ${parsed.data.display_name},
        bio          = ${parsed.data.bio ?? null},
        avatar_url   = ${avatarUrl}
      WHERE user_id = ${authResult.userId}
    `
  } catch (err: unknown) {
    // Unique constraint on display_name
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
      return { success: false, error: 'That display name is already taken. Please choose another.' }
    }
    console.error('[updateProfile]', err)
    return { success: false, error: 'Could not update profile. Please try again.' }
  }

  revalidatePath('/community/u/me')
  return { success: true }
}

// ─── Moderation actions (moderator/admin only) ────────────────────────────────

export async function resolveReport(
  reportId: string,
  resolution: 'actioned' | 'dismissed'
): Promise<ActionResult> {
  const authResult = await requireMod()
  if (!authResult.ok) return { success: false, error: authResult.error }

  await sql`
    UPDATE reports
    SET status = ${resolution}, reviewed_by = ${authResult.userId}, reviewed_at = NOW()
    WHERE id = ${reportId}
  `

  revalidatePath('/community/moderation')
  return { success: true }
}

export async function banUser(targetUserId: string): Promise<ActionResult> {
  const authResult = await requireMod()
  if (!authResult.ok) return { success: false, error: authResult.error }

  // Mods cannot ban admins
  const { rows } = await sql<{ role: string }>`
    SELECT role FROM profiles WHERE user_id = ${targetUserId} LIMIT 1
  `
  if (rows.length === 0) return { success: false, error: 'User not found.' }
  if (rows[0].role === 'admin') {
    return { success: false, error: 'Admins cannot be banned via this interface.' }
  }

  await sql`UPDATE profiles SET is_banned = true WHERE user_id = ${targetUserId}`

  revalidatePath('/community/moderation')
  return { success: true }
}

export async function unbanUser(targetUserId: string): Promise<ActionResult> {
  const authResult = await requireMod()
  if (!authResult.ok) return { success: false, error: authResult.error }

  await sql`UPDATE profiles SET is_banned = false WHERE user_id = ${targetUserId}`

  revalidatePath('/community/moderation')
  return { success: true }
}

export async function pinQuestion(questionId: string, pin: boolean): Promise<ActionResult> {
  const authResult = await requireMod()
  if (!authResult.ok) return { success: false, error: authResult.error }

  const { rows } = await sql<{ slug: string }>`
    UPDATE questions SET is_pinned = ${pin} WHERE id = ${questionId} RETURNING slug
  `

  if (rows.length > 0) revalidatePath(`/community/${rows[0].slug}`)
  revalidatePath('/community')
  return { success: true }
}
