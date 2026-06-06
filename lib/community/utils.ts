/**
 * Community utility functions — pure, no DB calls.
 * Used by queries, actions, route pages, and components.
 */
import slugify from 'slugify'
import { IMAGE_URL_ALLOWED_DOMAINS } from '@/lib/types/community'

/**
 * Convert a question title to a URL-safe kebab-case slug.
 * Uses `slugify` for Unicode/diacritic handling + adds a short hash suffix
 * to guard against collisions (caller appends suffix when needed).
 */
export function generateSlugFromTitle(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,     // strip special chars
    trim: true,
  }).slice(0, 100)
}

/**
 * Generate a default display_name from an email address.
 * Takes the local part, slugifies it, caps at 30 chars.
 * Caller appends a short unique suffix on conflict (see lib/auth/db.ts).
 */
export function generateDisplayName(email: string): string {
  const local = email.split('@')[0] ?? 'member'
  return slugify(local, { lower: true, strict: true, trim: true }).slice(0, 30)
}

/**
 * Validate and sanitize an image URL.
 * Returns the URL if valid (HTTPS + allowed domain), null otherwise.
 * Brief §3: domain whitelist enforcement.
 */
export function sanitizeImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return null
    const hostname = parsed.hostname.toLowerCase()
    const allowed = IMAGE_URL_ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    )
    return allowed ? url : null
  } catch {
    return null
  }
}

/**
 * Truncate text to a character limit, breaking at word boundaries.
 * Used for OG description generation from question body.
 */
export function truncateToWords(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

/**
 * Strip markdown syntax from text for use in meta descriptions and previews.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]+`{1,3}/g, '')
    .replace(/>\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/[-*+]\s+/g, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}

/**
 * Format a timestamp as a relative string ("3 minutes ago", "2 days ago").
 * Falls back to absolute date for anything older than 30 days.
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`

  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Moderation: check if a body contains ≥ 3 external links.
 * Used to soft-flag posts for moderator review on insert.
 */
export function countExternalLinks(body: string): number {
  const matches = body.match(/https?:\/\//g)
  return matches ? matches.length : 0
}

/**
 * Check if text is effectively empty (whitespace-only after markdown strip).
 */
export function isEffectivelyEmpty(text: string): boolean {
  return stripMarkdown(text).trim().length === 0
}
