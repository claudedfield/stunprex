/**
 * TypeScript types for the StunpreX community database.
 * Matches the schema in supabase/migrations/001_community_schema.sql exactly.
 * Used to type the Supabase client (Database generic).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'moderator' | 'admin'

export type PostCategory =
  | 'methodology'
  | 'coaching'
  | 'player-development'
  | 'parent-corner'
  | 'general'

export type ContentStatus = 'published' | 'hidden' | 'deleted'

export type ReactionTargetType = 'post' | 'comment'

export type ReportTargetType = 'post' | 'comment' | 'user'

export type ReportStatus = 'open' | 'reviewed' | 'actioned' | 'dismissed'

// ─── Row types (what the DB returns) ─────────────────────────────────────────

export interface ProfileRow {
  id: string            // uuid — matches auth.users.id
  email: string
  display_name: string  // unique, required
  bio: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string    // ISO 8601
  is_banned: boolean
}

export interface PostRow {
  id: string
  author_id: string     // FK → profiles.id
  title: string         // ≤ 200 chars
  slug: string          // unique, kebab-case generated from title
  body: string          // markdown, sanitised before render
  category: PostCategory
  status: ContentStatus
  image_url: string | null  // optional featured image — HTTPS URL, domain-whitelisted
  created_at: string
  updated_at: string
  reaction_count: number    // cached count — updated by trigger
}

export interface CommentRow {
  id: string
  post_id: string               // FK → posts.id
  parent_comment_id: string | null  // FK → comments.id (nullable, one level nesting max)
  author_id: string             // FK → profiles.id
  body: string                  // markdown, sanitised before render
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface ReactionRow {
  id: string
  user_id: string               // FK → profiles.id
  target_type: ReactionTargetType
  target_id: string             // FK → posts.id OR comments.id
  created_at: string
  // UNIQUE(user_id, target_type, target_id) enforced at DB level
}

export interface ReportRow {
  id: string
  reporter_id: string           // FK → profiles.id
  target_type: ReportTargetType
  target_id: string             // FK → posts.id OR comments.id OR profiles.id
  reason: string                // required text
  status: ReportStatus
  reviewed_by: string | null    // FK → profiles.id (moderator/admin who reviewed)
  reviewed_at: string | null
  created_at: string
}

// ─── Insert types (what we send to DB) ───────────────────────────────────────

export type ProfileInsert = Omit<ProfileRow, 'created_at' | 'is_banned' | 'role'> & {
  role?: UserRole
  is_banned?: boolean
}

export type PostInsert = Omit<PostRow, 'id' | 'created_at' | 'updated_at' | 'reaction_count' | 'status'> & {
  id?: string
  status?: ContentStatus
}

export type CommentInsert = Omit<CommentRow, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  id?: string
  status?: ContentStatus
}

export type ReactionInsert = Omit<ReactionRow, 'id' | 'created_at'> & {
  id?: string
}

export type ReportInsert = Omit<ReportRow, 'id' | 'created_at' | 'status' | 'reviewed_by' | 'reviewed_at'> & {
  id?: string
  status?: ReportStatus
}

// ─── Update types ─────────────────────────────────────────────────────────────

export type PostUpdate = Partial<Pick<PostRow, 'title' | 'slug' | 'body' | 'category' | 'status' | 'image_url'>>

export type CommentUpdate = Partial<Pick<CommentRow, 'body' | 'status'>>

export type ProfileUpdate = Partial<Pick<ProfileRow, 'display_name' | 'bio' | 'avatar_url' | 'role' | 'is_banned'>>

export type ReportUpdate = Partial<Pick<ReportRow, 'status' | 'reviewed_by' | 'reviewed_at'>>

// ─── View/join types (enriched rows returned by queries) ─────────────────────

/** Post with author profile — used in index and detail views */
export interface PostWithAuthor extends PostRow {
  author: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'role'>
}

/** Comment with author profile — used in thread views */
export interface CommentWithAuthor extends CommentRow {
  author: Pick<ProfileRow, 'id' | 'display_name' | 'avatar_url' | 'role'>
  replies?: CommentWithAuthor[]  // populated client-side from flat list
}

/** Report with target metadata — used in moderation queue */
export interface ReportWithDetails extends ReportRow {
  reporter: Pick<ProfileRow, 'id' | 'display_name'>
}

// ─── Supabase Database type (for client generic) ─────────────────────────────
// GenericTable requires Row, Insert, Update, and Relationships.
// Relationships is required by @supabase/supabase-js GenericTable constraint —
// without it every .from() call resolves to never.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      posts: {
        Row: PostRow
        Insert: PostInsert
        Update: PostUpdate
        Relationships: []
      }
      comments: {
        Row: CommentRow
        Insert: CommentInsert
        Update: CommentUpdate
        Relationships: []
      }
      reactions: {
        Row: ReactionRow
        Insert: ReactionInsert
        Update: Partial<ReactionRow>
        Relationships: []
      }
      reports: {
        Row: ReportRow
        Insert: ReportInsert
        Update: ReportUpdate
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      post_category: PostCategory
      content_status: ContentStatus
      reaction_target_type: ReactionTargetType
      report_target_type: ReportTargetType
      report_status: ReportStatus
    }
  }
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

/** Human-readable category labels */
export const CATEGORY_LABELS: Record<PostCategory, string> = {
  methodology: 'Methodology',
  coaching: 'Coaching',
  'player-development': 'Player Development',
  'parent-corner': 'Parent Corner',
  general: 'General',
}

/** All categories in display order */
export const ALL_CATEGORIES: PostCategory[] = [
  'methodology',
  'coaching',
  'player-development',
  'parent-corner',
  'general',
]

/** Image URL domain whitelist (COO decision Q12 supplement) */
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
