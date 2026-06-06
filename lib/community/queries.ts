/**
 * Server-side community query functions.
 * All read queries — no mutations. Use lib/community/actions.ts for writes.
 * Uses Vercel Postgres sql tagged template — server-only (never call from client).
 */
import { sql } from '@/db'
import type {
  QuestionRow,
  QuestionWithAuthor,
  AnswerWithAuthor,
  CommentWithAuthor,
  TagRow,
  MemberProfile,
  Paginated,
  SortOrder,
  QuestionCategory,
} from '@/lib/types/community'

// ─── Options ──────────────────────────────────────────────────────────────────

export interface GetQuestionsOptions {
  category?: QuestionCategory
  tagSlug?: string
  search?: string
  sort?: SortOrder
  authorId?: string
  page?: number
  perPage?: number
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Fetch tag arrays for a batch of question IDs in one query. */
async function getTagsForQuestions(
  questionIds: string[]
): Promise<Map<string, TagRow[]>> {
  if (questionIds.length === 0) return new Map()

  // Build a VALUES list for the IN clause via a lateral join approach
  // Vercel Postgres sql tag doesn't support array parameters directly for IN,
  // so we fetch all question_tags + tags for the given IDs.
  const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(', ')
  const { rows } = await sql.query<{ question_id: string } & TagRow>(
    `SELECT qt.question_id, t.id, t.label, t.slug, t.description, 0::int AS question_count
     FROM question_tags qt
     JOIN tags t ON t.id = qt.tag_id
     WHERE qt.question_id IN (${placeholders})
     ORDER BY t.label`,
    questionIds
  )

  const map = new Map<string, TagRow[]>()
  for (const row of rows) {
    const { question_id, ...tag } = row
    if (!map.has(question_id)) map.set(question_id, [])
    map.get(question_id)!.push(tag as TagRow)
  }
  return map
}

/** Check if a single user has upvoted a target. */
async function hasUserUpvoted(
  userId: string,
  targetType: 'question' | 'answer',
  targetId: string
): Promise<boolean> {
  const { rows } = await sql<{ exists: boolean }>`
    SELECT EXISTS(
      SELECT 1 FROM upvotes
      WHERE user_id = ${userId}
        AND target_type = ${targetType}
        AND target_id = ${targetId}
    ) AS exists
  `
  return rows[0]?.exists ?? false
}

/** Bulk check upvote state for a user against a set of target IDs. */
async function getUserUpvotedSet(
  userId: string,
  targetType: 'question' | 'answer',
  targetIds: string[]
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set()
  const placeholders = targetIds.map((_, i) => `$${i + 3}`).join(', ')
  const { rows } = await sql.query<{ target_id: string }>(
    `SELECT target_id FROM upvotes
     WHERE user_id = $1 AND target_type = $2 AND target_id IN (${placeholders})`,
    [userId, targetType, ...targetIds]
  )
  return new Set(rows.map((r) => r.target_id))
}

// ─── Questions ────────────────────────────────────────────────────────────────

/**
 * Paginated question list with author profile + tags.
 * Supports category, tag, search, sort, and author filters.
 */
export async function getQuestions(
  opts: GetQuestionsOptions = {}
): Promise<Paginated<QuestionWithAuthor>> {
  const { category, tagSlug, search, sort = 'newest', authorId, page = 1, perPage = 20 } = opts
  const offset = (page - 1) * perPage

  // Build WHERE clauses dynamically
  const conditions: string[] = ["q.status = 'published'"]
  const params: unknown[] = []
  let p = 1

  if (category) {
    conditions.push(`q.category = $${p++}`)
    params.push(category)
  }
  if (authorId) {
    conditions.push(`q.author_id = $${p++}`)
    params.push(authorId)
  }
  if (search) {
    conditions.push(`(q.title ILIKE $${p} OR q.body ILIKE $${p})`)
    params.push(`%${search}%`)
    p++
  }
  if (tagSlug) {
    conditions.push(`EXISTS(
      SELECT 1 FROM question_tags qt2
      JOIN tags t2 ON t2.id = qt2.tag_id
      WHERE qt2.question_id = q.id AND t2.slug = $${p++}
    )`)
    params.push(tagSlug)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const orderClause =
    sort === 'top'
      ? 'ORDER BY q.upvote_count DESC, q.created_at DESC'
      : sort === 'unanswered'
        ? 'ORDER BY q.answer_count ASC, q.created_at DESC'
        : 'ORDER BY q.is_pinned DESC, q.created_at DESC'

  const query = `
    SELECT
      q.*,
      p.display_name AS author_display_name,
      p.avatar_url   AS author_avatar_url,
      p.role         AS author_role,
      COUNT(*) OVER() AS total_count
    FROM questions q
    JOIN profiles p ON p.user_id = q.author_id
    ${whereClause}
    ${orderClause}
    LIMIT $${p} OFFSET $${p + 1}
  `
  params.push(perPage, offset)

  const { rows } = await sql.query<
    QuestionWithAuthor & { author_display_name: string; author_avatar_url: string | null; author_role: string; total_count: string }
  >(query, params)

  const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0
  const questionIds = rows.map((r) => r.id)
  const tagsMap = await getTagsForQuestions(questionIds)

  const items: QuestionWithAuthor[] = rows.map((row) => {
    const { author_display_name, author_avatar_url, author_role, total_count, ...q } = row
    return {
      ...q,
      author: {
        display_name: author_display_name,
        avatar_url: author_avatar_url ?? null,
        role: author_role as QuestionWithAuthor['author']['role'],
      },
      tags: tagsMap.get(q.id) ?? [],
    }
  })

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}

/**
 * Fetch a single question by slug.
 * Increments view_count fire-and-forget (never blocks render).
 * Fetches tags and viewer upvote state in parallel.
 */
export async function getQuestionBySlug(
  slug: string,
  viewerUserId?: string
): Promise<QuestionWithAuthor | null> {
  const { rows } = await sql<
    QuestionWithAuthor & { author_display_name: string; author_avatar_url: string | null; author_role: string }
  >`
    SELECT
      q.*,
      p.display_name AS author_display_name,
      p.avatar_url   AS author_avatar_url,
      p.role         AS author_role
    FROM questions q
    JOIN profiles p ON p.user_id = q.author_id
    WHERE q.slug = ${slug}
      AND q.status = 'published'
    LIMIT 1
  `

  if (rows.length === 0) return null
  const row = rows[0]

  // Fire-and-forget view increment — don't await, don't block
  sql`UPDATE questions SET view_count = view_count + 1 WHERE id = ${row.id}`.catch(() => {})

  const [tagsMap, viewerHasUpvoted] = await Promise.all([
    getTagsForQuestions([row.id]),
    viewerUserId ? hasUserUpvoted(viewerUserId, 'question', row.id) : Promise.resolve(false),
  ])

  const { author_display_name, author_avatar_url, author_role, ...q } = row
  return {
    ...q,
    author: {
      display_name: author_display_name,
      avatar_url: author_avatar_url ?? null,
      role: author_role as QuestionWithAuthor['author']['role'],
    },
    tags: tagsMap.get(q.id) ?? [],
    viewer_has_upvoted: viewerHasUpvoted,
  }
}

// ─── Answers ──────────────────────────────────────────────────────────────────

/**
 * Fetch all published answers for a question, accepted answer first.
 * Bulk-fetches viewer upvote state in a single query.
 */
export async function getAnswersByQuestion(
  questionId: string,
  viewerUserId?: string
): Promise<AnswerWithAuthor[]> {
  const { rows } = await sql<
    AnswerWithAuthor & { author_display_name: string; author_avatar_url: string | null; author_role: string; is_accepted_answer: boolean }
  >`
    SELECT
      a.*,
      p.display_name AS author_display_name,
      p.avatar_url   AS author_avatar_url,
      p.role         AS author_role,
      (q.accepted_answer_id = a.id) AS is_accepted_answer
    FROM answers a
    JOIN profiles p ON p.user_id = a.author_id
    JOIN questions q ON q.id = a.question_id
    WHERE a.question_id = ${questionId}
      AND a.status = 'published'
    ORDER BY
      (q.accepted_answer_id = a.id) DESC,
      a.upvote_count DESC,
      a.created_at ASC
  `

  if (rows.length === 0) return []

  const answerIds = rows.map((r) => r.id)
  const upvotedSet = viewerUserId
    ? await getUserUpvotedSet(viewerUserId, 'answer', answerIds)
    : new Set<string>()

  return rows.map((row) => {
    const { author_display_name, author_avatar_url, author_role, is_accepted_answer, ...a } = row
    return {
      ...a,
      is_accepted: is_accepted_answer,
      author: {
        display_name: author_display_name,
        avatar_url: author_avatar_url ?? null,
        role: author_role as AnswerWithAuthor['author']['role'],
      },
      viewer_has_upvoted: upvotedSet.has(a.id),
    }
  })
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Fetch all published comments for a target (question or answer).
 * Ordered oldest-first for natural reading flow.
 */
export async function getComments(
  targetType: 'question' | 'answer',
  targetId: string
): Promise<CommentWithAuthor[]> {
  const { rows } = await sql<
    CommentWithAuthor & { author_display_name: string; author_avatar_url: string | null; author_role: string }
  >`
    SELECT
      c.*,
      p.display_name AS author_display_name,
      p.avatar_url   AS author_avatar_url,
      p.role         AS author_role
    FROM comments c
    JOIN profiles p ON p.user_id = c.author_id
    WHERE c.target_type = ${targetType}
      AND c.target_id = ${targetId}
      AND c.status = 'published'
    ORDER BY c.created_at ASC
  `

  return rows.map((row) => {
    const { author_display_name, author_avatar_url, author_role, ...c } = row
    return {
      ...c,
      author: {
        display_name: author_display_name,
        avatar_url: author_avatar_url ?? null,
      },
    }
  })
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

/** Fetch all tags ordered by question_count descending, then label. */
export async function getAllTags(): Promise<TagRow[]> {
  const { rows } = await sql<TagRow>`
    SELECT
      id,
      label,
      slug,
      description,
      (SELECT COUNT(*)::int FROM question_tags qt WHERE qt.tag_id = tags.id) AS question_count
    FROM tags
    ORDER BY question_count DESC, label ASC
  `
  return rows
}

/** Fetch a single tag by slug. Returns null if not found. */
export async function getTagBySlug(slug: string): Promise<TagRow | null> {
  const { rows } = await sql<TagRow>`
    SELECT
      id,
      label,
      slug,
      description,
      (SELECT COUNT(*)::int FROM question_tags qt WHERE qt.tag_id = tags.id) AS question_count
    FROM tags
    WHERE slug = ${slug}
    LIMIT 1
  `
  return rows[0] ?? null
}

// ─── Member profiles ──────────────────────────────────────────────────────────

/**
 * Fetch a member's public profile with activity counts.
 * Returns null if the display_name doesn't exist.
 */
export async function getMemberProfile(displayName: string): Promise<MemberProfile | null> {
  const { rows: profileRows } = await sql<MemberProfile>`
    SELECT
      p.*,
      (SELECT COUNT(*) FROM questions q WHERE q.author_id = p.user_id AND q.status = 'published')::int AS question_count,
      (SELECT COUNT(*) FROM answers a WHERE a.author_id = p.user_id AND a.status = 'published')::int AS answer_count
    FROM profiles p
    WHERE p.display_name = ${displayName}
    LIMIT 1
  `

  if (profileRows.length === 0) return null
  const profile = profileRows[0]

  // Recent questions — last 5
  const { rows: recentQuestions } = await sql<{ id: string; title: string; slug: string; category: string; created_at: string }>`
    SELECT id, title, slug, category, created_at
    FROM questions
    WHERE author_id = ${profile.user_id}
      AND status = 'published'
    ORDER BY created_at DESC
    LIMIT 5
  `

  return {
    ...profile,
    recent_questions: recentQuestions as Pick<QuestionRow, 'id' | 'slug' | 'title' | 'category' | 'created_at'>[],
  }
}

// ─── Moderation ───────────────────────────────────────────────────────────────

/**
 * Get all open reports with reporter info.
 * Caller must verify role === 'moderator' | 'admin' before calling.
 */
export async function getOpenReports() {
  const { rows } = await sql<{
    id: string
    target_type: string
    target_id: string
    reason: string
    detail: string | null
    status: string
    created_at: string
    reporter_id: string
    reporter_display_name: string
  }>`
    SELECT
      r.*,
      p.display_name AS reporter_display_name
    FROM reports r
    JOIN profiles p ON p.user_id = r.reporter_id
    WHERE r.status = 'open'
    ORDER BY r.created_at ASC
  `
  return rows
}

// ─── Search index ─────────────────────────────────────────────────────────────

/**
 * Fetch lightweight data for FlexSearch index hydration.
 * Called by /community/search-index/route.ts — returns only published questions.
 * No body content — title + excerpt only for search performance.
 */
export async function getSearchIndexData(): Promise<
  Array<{ id: string; title: string; slug: string; category: string; tag_names: string }>
> {
  const { rows } = await sql<{
    id: string
    title: string
    slug: string
    category: string
    tag_names: string
  }>`
    SELECT
      q.id,
      q.title,
      q.slug,
      q.category,
      COALESCE(
        STRING_AGG(t.label, ' ' ORDER BY t.label),
        ''
      ) AS tag_names
    FROM questions q
    LEFT JOIN question_tags qt ON qt.question_id = q.id
    LEFT JOIN tags t ON t.id = qt.tag_id
    WHERE q.status = 'published'
    GROUP BY q.id, q.title, q.slug, q.category
    ORDER BY q.created_at DESC
  `
  return rows
}
