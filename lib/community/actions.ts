'use server'
/**
 * Server Actions for community mutations.
 * All actions use the server Supabase client.
 * Input validation via zod before any DB write.
 * These are imported directly by forms in Server/Client Components.
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateSlugFromTitle, sanitizeImageUrl } from '@/lib/community/utils'
import type { PostCategory } from '@/lib/types/community'

// ─── Validation schemas ───────────────────────────────────────────────────────

const PostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be 200 characters or fewer'),
  body: z
    .string()
    .min(10, 'Post body must be at least 10 characters')
    .refine(
      (v) => v.trim().length > 0,
      'Post body cannot be empty'
    )
    .refine(
      (v) => {
        // Gate: ≥3 external links triggers soft block
        const linkMatches = v.match(/https?:\/\//g) ?? []
        return linkMatches.length < 3
      },
      'Posts with 3 or more external links are blocked. Please reduce the number of links.'
    ),
  category: z.enum([
    'methodology',
    'coaching',
    'player-development',
    'parent-corner',
    'general',
  ] as const),
  image_url: z.string().url().optional().or(z.literal('')),
})

const CommentSchema = z.object({
  body: z
    .string()
    .min(2, 'Comment must be at least 2 characters')
    .max(5000, 'Comment must be 5000 characters or fewer')
    .refine(
      (v) => v.trim().length > 0,
      'Comment cannot be empty'
    ),
  post_id: z.string().uuid(),
  parent_comment_id: z.string().uuid().optional(),
})

const ReportSchema = z.object({
  target_type: z.enum(['post', 'comment', 'user'] as const),
  target_id: z.string().uuid(),
  reason: z
    .string()
    .min(10, 'Please describe the issue in at least 10 characters')
    .max(1000, 'Reason must be 1000 characters or fewer'),
})

const ProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be 30 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Display name can only contain letters, numbers, underscores, and hyphens'),
  bio: z.string().max(300, 'Bio must be 300 characters or fewer').optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stunprex.com'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[signInWithMagicLink]', error)
    return { error: 'Could not send sign-in link. Please try again.' }
  }

  return { success: true, message: 'Check your email — we\'ve sent you a sign-in link.' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://stunprex.com'}/auth/callback`,
    },
  })

  if (error) {
    console.error('[signInWithGoogle]', error)
    return { error: 'Could not sign in with Google. Please try again.' }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Post actions ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createPost(formData: FormData): Promise<ActionResult<{ slug: string }>> {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be signed in to post.' }

  // Ban check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.is_banned) {
    return { success: false, error: 'Your account cannot post at this time.' }
  }

  // Validate
  const raw = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    category: formData.get('category') as PostCategory,
    image_url: (formData.get('image_url') as string) || undefined,
  }

  const parsed = PostSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Sanitize image URL if provided
  let imageUrl: string | null = null
  if (parsed.data.image_url) {
    imageUrl = sanitizeImageUrl(parsed.data.image_url)
    if (!imageUrl) {
      return {
        success: false,
        error: 'Image URL must be HTTPS and from an allowed hosting service.',
      }
    }
  }

  // Generate unique slug
  const baseSlug = generateSlugFromTitle(parsed.data.title)
  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // Insert
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      category: parsed.data.category,
      image_url: imageUrl,
    })
    .select('slug')
    .single()

  if (error) {
    console.error('[createPost]', error)
    return { success: false, error: 'Could not create post. Please try again.' }
  }

  revalidatePath('/community')
  return { success: true, data: { slug: data.slug } }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  // Soft-delete via status = 'deleted' (RLS enforces author OR mod/admin)
  const { error } = await supabase
    .from('posts')
    .update({ status: 'deleted' })
    .eq('id', postId)

  if (error) {
    console.error('[deletePost]', error)
    return { success: false, error: 'Could not delete post.' }
  }

  revalidatePath('/community')
  return { success: true }
}

// ─── Comment actions ──────────────────────────────────────────────────────────

export async function createComment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be signed in to comment.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .single()
  if (!profile || profile.is_banned) {
    return { success: false, error: 'Your account cannot comment at this time.' }
  }

  const raw = {
    body: formData.get('body') as string,
    post_id: formData.get('post_id') as string,
    parent_comment_id: (formData.get('parent_comment_id') as string) || undefined,
  }

  const parsed = CommentSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: user.id,
      post_id: parsed.data.post_id,
      parent_comment_id: parsed.data.parent_comment_id ?? null,
      body: parsed.data.body,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createComment]', error)
    return { success: false, error: 'Could not post comment. Please try again.' }
  }

  revalidatePath(`/community/${raw.post_id}`)
  return { success: true, data: { id: data.id } }
}

export async function deleteComment(commentId: string, postSlug: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('comments')
    .update({ status: 'deleted' })
    .eq('id', commentId)

  if (error) {
    console.error('[deleteComment]', error)
    return { success: false, error: 'Could not delete comment.' }
  }

  revalidatePath(`/community/${postSlug}`)
  return { success: true }
}

// ─── Reaction actions ─────────────────────────────────────────────────────────

export async function toggleReaction(
  targetType: 'post' | 'comment',
  targetId: string
): Promise<ActionResult<{ reacted: boolean }>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sign in to react.' }

  // Check existing
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id)
    if (error) return { success: false, error: 'Could not remove reaction.' }
    return { success: true, data: { reacted: false } }
  } else {
    // Add reaction
    const { error } = await supabase
      .from('reactions')
      .insert({ user_id: user.id, target_type: targetType, target_id: targetId })
    if (error) {
      if (error.code === '23505') {
        // Already reacted (race condition) — treat as success
        return { success: true, data: { reacted: true } }
      }
      return { success: false, error: 'Could not add reaction.' }
    }
    return { success: true, data: { reacted: true } }
  }
}

// ─── Report actions ───────────────────────────────────────────────────────────

export async function submitReport(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'You must be signed in to report content.' }

  const raw = {
    target_type: formData.get('target_type') as string,
    target_id: formData.get('target_id') as string,
    reason: formData.get('reason') as string,
  }

  const parsed = ReportSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: parsed.data.target_type,
    target_id: parsed.data.target_id,
    reason: parsed.data.reason,
  })

  if (error) {
    console.error('[submitReport]', error)
    return { success: false, error: 'Could not submit report. Please try again.' }
  }

  return { success: true }
}

// ─── Profile actions ──────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const raw = {
    display_name: formData.get('display_name') as string,
    bio: (formData.get('bio') as string) || undefined,
    avatar_url: (formData.get('avatar_url') as string) || undefined,
  }

  const parsed = ProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'That display name is already taken. Please choose another.',
      }
    }
    console.error('[updateProfile]', error)
    return { success: false, error: 'Could not update profile. Please try again.' }
  }

  revalidatePath('/community/u/me')
  return { success: true }
}

// ─── Moderation actions (admin/moderator only) ────────────────────────────────

export async function resolveReport(
  reportId: string,
  resolution: 'actioned' | 'dismissed'
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('reports')
    .update({
      status: resolution,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) {
    console.error('[resolveReport]', error)
    return { success: false, error: 'Could not resolve report.' }
  }

  revalidatePath('/community/moderation')
  return { success: true }
}

export async function banUser(profileId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', profileId)

  if (error) {
    console.error('[banUser]', error)
    return { success: false, error: 'Could not ban user.' }
  }

  revalidatePath('/community/moderation')
  return { success: true }
}
