/**
 * TagChip — small pill display for a single tag.
 * Optional `href` makes it a filter link; otherwise renders as a span.
 */
import Link from 'next/link'

interface TagChipProps {
  name: string
  slug?: string
  /** Render as a link to the tag page. Defaults to true when slug provided. */
  linkable?: boolean
}

export default function TagChip({ name, slug, linkable = true }: TagChipProps) {
  const classes =
    'inline-block rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/80 transition-colors hover:bg-deepblue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1'

  if (slug && linkable) {
    return (
      <Link href={`/community/tag/${slug}`} className={classes}>
        {name}
      </Link>
    )
  }

  return (
    <span className="inline-block rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/80">
      {name}
    </span>
  )
}
