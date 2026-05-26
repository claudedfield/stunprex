/**
 * Server-side community query functions.
 * All functions use the server Supabase client (cookies-based auth).
 * Called from Server Components, Server Actions, and Route Handlers only.
 */
import { createClient } from '@/lib/supabase/server'
import type {
  PostWithAuthor,
  CommentWithAuthor,
  PostCategory,
  ContentStatus,
} from '@/lib/types/community'

// ─── Posts ────────────────────────────────────────────────────────────────────

export interface GetPostsOptions {
  category?: PostCategory
  status?: ContentStatus
  authorId?: string
  search?: string
  page?: number
  perPage?: number
}

/** Fetch paginated posts with author profile. Anonymous-safe (RLS handles visibility). */
export async function getPosts(options: GetPostsOptions = {}): Promise<{
  posts: PostWithAuthor[]
  total: number
  page: number
  perPage: number
  totalPages: number
}> {
  const supabase = await createClient()
  const { category, authorId, search, page = 1, perPage = 20 } = options
  const offset = (page - 1) * perPage

  let query = supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (category) query = query.eq('category', category)
  if (authorId) query = query.eq('author_id', authorId)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('[getPosts]', error)
    return { posts: [], total: 0, page, perPage, totalPages: 0 }
  }

  const total = count ?? 0
  return {
    posts: (data ?? []) as PostWithAuthor[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  }
}

/** Fetch a single post by slug. Returns null if not found or not visible. */
export async function getPostBySlug(slug: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url, role)
    `
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getPostBySlug]', error)
    return null
  }

  return data as PostWithAuthor
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/**
 * Fetch all published comments for a post, with author profiles.
 * Returns a flat list; caller assembles the one-level tree (top-level + replies).
 */
export async function getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      author:profiles!comments_author_id_fkey(id, display_name, avatar_url, role)
    `
    )
    .eq('post_id', postId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getCommentsByPost]', error)
    return []
  }

  return (data ?? []) as CommentWithAuthor[]
}

/**
 * Assemble flat comment list into a one-level tree.
 * Top-level comments (parent_comment_id = null) have a replies array.
 * Replies (parent_comment_id set) are nested under their parent.
 */
export function buildCommentTree(flatComments: CommentWithAuthor[]): CommentWithAuthor[] {
  const topLevel: CommentWithAuthor[] = []
  const byId = new Map<string, CommentWithAuthor>()

  for (const c of flatComments) {
    byId.set(c.id, { ...c, replies: [] })
  }

  for (const c of flatComments) {
    const node = byId.get(c.id)!
    if (!c.parent_comment_id) {
      topLevel.push(node)
    } else {
      const parent = byId.get(c.parent_comment_id)
      if (parent) {
        parent.replies = parent.replies ?? []
        parent.replies.push(node)
      }
    }
  }

  return topLevel
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Get the currently authenticated user's profile. Returns null if not signed in. */
export async function getCurrentProfile() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getCurrentProfile]', error)
    return null
  }

  return data
}

/** Get a profile by display_name (for public profile pages). */
export async function getProfileByDisplayName(displayName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('display_name', displayName)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getProfileByDisplayName]', error)
    return null
  }

  return data
}

// ─── Reactions ────────────────────────────────────────────────────────────────

/** Check if the current user has reacted to a target. Returns false for anon. */
export async function getUserReaction(
  targetType: 'post' | 'comment',
  targetId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  return data !== null
}

// ─── Moderation ───────────────────────────────────────────────────────────────

/** Get open reports (moderator/admin only — RLS enforces). */
export async function getOpenReports() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reports_reporter_id_fkey(id, display_name)
    `
    )
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getOpenReports]', error)
    return []
  }

  return data ?? []
}
