/**
 * StunpreX Community Q&A — TypeScript types.
 * Stack: Vercel Postgres + Auth.js v5. No RLS — app-level authorization in every mutating action.
 *
 * Tables mirror db/migrations/002_community_schema.sql.
 * Auth.js tables (users, accounts, sessions, verification_token) are in 001_auth_schema.sql
 * and owned by Auth.js — do not redefine them here.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'moderator' | 'admin'
export type ContentStatus = 'published' | 'hidden' | 'deleted'
export type UpvoteTargetType = 'question' | 'answer'
export type CommentTargetType = 'question' | 'answer'
export type ReportTargetType = 'question' | 'answer' | 'comment' | 'user'
export type ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed'
export type SortOrder = 'newest' | 'top' | 'unanswered'

// ─── Category ─────────────────────────────────────────────────────────────────

export type QuestionCategory =
  | 'methodology'
  | 'player-development'
  | 'coaching'
  | 'parent-corner'
  | 'pro-breakdown'
  | 'wins-showcase'
  | 'general'

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  methodology: 'Methodology',
  'player-development': 'Player development',
  coaching: 'Coaching',
  'parent-corner': 'Parent corner',
  'pro-breakdown': 'Pro Breakdown discussion',
  'wins-showcase': 'Wins showcase',
  general: 'General',
}

export const ALL_CATEGORIES: QuestionCategory[] = [
  'methodology',
  'player-development',
  'coaching',
  'parent-corner',
  'pro-breakdown',
  'wins-showcase',
  'general',
]

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileRow {
  user_id: string
  display_name: string       // ≤ 40 chars, kebab-clean
  bio: string | null         // ≤ 280 chars
  avatar_url: string | null  // HTTPS only
  role: UserRole
  is_banned: boolean
  wants_newsletter: boolean
  onboarded: boolean         // false until /community/welcome is visited
  created_at: string         // ISO
}

export type ProfileInsert = Omit<ProfileRow, 'created_at'> & {
  created_at?: string
}

export type ProfileUpdate = Partial<Pick<
  ProfileRow,
  'display_name' | 'bio' | 'avatar_url' | 'role' | 'is_banned' | 'wants_newsletter' | 'onboarded'
>>

// ─── Questions ────────────────────────────────────────────────────────────────

export interface QuestionRow {
  id: string
  author_id: string
  title: string              // ≤ 200 chars
  slug: string               // UNIQUE
  body: string               // markdown
  category: QuestionCategory
  audience_layer: string | null  // Player | Parent | Coach | Halo
  status: ContentStatus
  accepted_answer_id: string | null
  upvote_count: number       // cached
  answer_count: number       // cached
  view_count: number         // cached
  is_pinned: boolean         // admin weekly rituals (§8 brief)
  created_at: string
  updated_at: string
}

export type QuestionInsert = Omit<
  QuestionRow,
  'id' | 'upvote_count' | 'answer_count' | 'view_count' | 'is_pinned' | 'created_at' | 'updated_at'
> & {
  id?: string
  accepted_answer_id?: string | null
  is_pinned?: boolean
}

export type QuestionUpdate = Partial<Pick<
  QuestionRow,
  'title' | 'body' | 'category' | 'audience_layer' | 'status' | 'accepted_answer_id' | 'is_pinned' | 'updated_at'
>>

// ─── Answers ──────────────────────────────────────────────────────────────────

export interface AnswerRow {
  id: string
  question_id: string
  author_id: string
  body: string               // markdown
  status: ContentStatus
  upvote_count: number       // cached
  created_at: string
  updated_at: string
}

export type AnswerInsert = Omit<
  AnswerRow,
  'id' | 'upvote_count' | 'created_at' | 'updated_at'
> & { id?: string }

export type AnswerUpdate = Partial<Pick<AnswerRow, 'body' | 'status' | 'updated_at'>>

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CommentRow {
  id: string
  target_type: CommentTargetType
  target_id: string
  author_id: string
  body: string               // ≤ 600 chars markdown
  status: ContentStatus
  created_at: string
}

export type CommentInsert = Omit<CommentRow, 'id' | 'created_at'> & { id?: string }

// ─── Upvotes ──────────────────────────────────────────────────────────────────

export interface UpvoteRow {
  id: string
  user_id: string
  target_type: UpvoteTargetType
  target_id: string
  created_at: string
}

export type UpvoteInsert = Omit<UpvoteRow, 'id' | 'created_at'> & { id?: string }

// ─── Tags ─────────────────────────────────────────────────────────────────────

export interface TagRow {
  id: string
  slug: string               // kebab-case, UNIQUE
  label: string
  description: string | null
  question_count: number     // computed via subquery in queries
}

export interface QuestionTagRow {
  question_id: string
  tag_id: string
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportRow {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export type ReportInsert = Omit<ReportRow, 'id' | 'status' | 'reviewed_by' | 'reviewed_at' | 'created_at'> & {
  id?: string
}

// ─── View types (query join results) ─────────────────────────────────────────

export interface QuestionWithAuthor extends QuestionRow {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url' | 'role'>
  tags: Pick<TagRow, 'id' | 'slug' | 'label'>[]
  /** Whether the current user has upvoted this question (null = not authenticated) */
  viewer_has_upvoted?: boolean
}

export interface AnswerWithAuthor extends AnswerRow {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url' | 'role'>
  /** Whether this answer is the accepted answer for its question */
  is_accepted?: boolean
  /** Whether the current user has upvoted this answer */
  viewer_has_upvoted?: boolean
}

export interface CommentWithAuthor extends CommentRow {
  author: Pick<ProfileRow, 'display_name' | 'avatar_url'>
}

export interface MemberProfile extends ProfileRow {
  question_count: number
  answer_count: number
  recent_questions: Pick<QuestionRow, 'id' | 'slug' | 'title' | 'category' | 'created_at'>[]
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ─── Image domain whitelist (§3 brief) ────────────────────────────────────────
// Images allowed in question/answer bodies via markdown — HTTPS + domain check.

export const IMAGE_URL_ALLOWED_DOMAINS = [
  'imgur.com',
  'i.imgur.com',
  'unsplash.com',
  'images.unsplash.com',
  'wikimedia.org',
  'upload.wikimedia.org',
  'stunprex.com',
  'www.stunprex.com',
] as const

// ─── Seed tag slugs (§5 brief) ────────────────────────────────────────────────

export const SEED_TAGS = [
  // Audience
  { slug: 'player', label: 'Player' },
  { slug: 'parent', label: 'Parent' },
  { slug: 'coach', label: 'Coach' },
  { slug: 'halo', label: 'Halo' },
  // Age band
  { slug: 'u8', label: 'U8' },
  { slug: 'u10', label: 'U10' },
  { slug: 'u13', label: 'U13' },
  { slug: 'u16', label: 'U16' },
  { slug: 'u20', label: 'U20' },
  { slug: 'senior', label: 'Senior' },
  // Topic
  { slug: 'first-touch', label: 'First touch' },
  { slug: 'scanning', label: 'Scanning' },
  { slug: 'weak-foot', label: 'Weak foot' },
  { slug: 'dribbling', label: 'Dribbling' },
  { slug: 'passing', label: 'Passing' },
  { slug: 'shooting', label: 'Shooting' },
  { slug: 'defending', label: 'Defending' },
  { slug: 'tactical', label: 'Tactical' },
  { slug: 'mental', label: 'Mental' },
  { slug: 'nutrition', label: 'Nutrition' },
  { slug: 'recovery', label: 'Recovery' },
  { slug: 'academy', label: 'Academy' },
  { slug: 'deselection', label: 'Deselection' },
  { slug: 'goalkeeping', label: 'Goalkeeping' },
  // Drill-related
  { slug: 'drill-design', label: 'Drill design' },
  { slug: 'solo-practice', label: 'Solo practice' },
  { slug: 'small-sided', label: 'Small-sided' },
  { slug: 'match-prep', label: 'Match prep' },
] as const
