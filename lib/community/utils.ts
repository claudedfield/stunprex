/**
 * Community utility functions — pure, no Supabase calls.
 */
import { IMAGE_URL_ALLOWED_DOMAINS } from '@/lib/types/community'

/**
 * Convert a post title to a URL-safe kebab-case slug.
 * Mirrors the SQL generate_slug() function in 001_community_schema.sql.
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (keep spaces and hyphens)
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // strip leading/trailing hyphens
    .slice(0, 100)                   // cap at 100 chars
}

/**
 * Validate and sanitize an image URL.
 * Returns the URL if valid (HTTPS + allowed domain), null otherwise.
 * Implements COO Q12 supplement: domain whitelist.
 */
export function sanitizeImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    // Must be HTTPS
    if (parsed.protocol !== 'https:') return null

    // Must be on an allowed domain (exact match or subdomain)
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
 * Used for OG description generation from post body.
 */
export function truncateToWords(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

/**
 * Strip markdown syntax from text for use in meta descriptions and previews.
 * Not a full markdown parser — removes the most common syntax only.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')         // headers
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/_(.+?)_/g, '$1')         // italic underscore
    .replace(/`{1,3}[^`]+`{1,3}/g, '') // inline code / code blocks
    .replace(/>\s+/g, '')               // blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // links → text only
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')   // images → remove
    .replace(/[-*+]\s+/g, '')          // list bullets
    .replace(/\d+\.\s+/g, '')          // numbered lists
    .replace(/\n{2,}/g, ' ')           // multiple newlines → space
    .replace(/\n/g, ' ')               // single newlines → space
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
