/**
 * PostCardSmall — compact post card for capacity / age-band detail pages.
 */
import Link from 'next/link'
import type { PostCard } from '@/lib/types/post'
import { CATEGORY_SLUGS } from '@/lib/types/post'

interface Props {
  post: PostCard
}

export function PostCardSmall({ post }: Props) {
  const { frontmatter, slug, readingTime } = post
  const catSlug = CATEGORY_SLUGS[frontmatter.category]
  return (
    <Link
      href={`/blog/${slug}`}
      className="block rounded-lg border border-deepblue/15 bg-white p-5 hover:border-deepblue/40 transition-colors"
    >
      <p className="text-xs font-ui font-semibold uppercase tracking-widest text-orange mb-1">
        {frontmatter.category}
      </p>
      <h3 className="font-heading text-deepblue mb-2 text-lg">{frontmatter.title}</h3>
      <p className="text-sm text-brown/70 font-body leading-relaxed line-clamp-2">
        {frontmatter.description}
      </p>
      <p className="mt-3 text-xs text-deepblue/60 font-ui">
        {readingTime} min read · {frontmatter.audienceLayer}
      </p>
    </Link>
  )
}
