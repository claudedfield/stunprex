/**
 * DrillCardSmall — compact drill card for capacity / age-band detail pages.
 * Reuses card style from Style System §5.3 without filter/search overhead.
 */
import Link from 'next/link'
import type { DrillCard } from '@/lib/types/drill'

interface Props {
  drill: DrillCard
}

export function DrillCardSmall({ drill }: Props) {
  const { frontmatter, slug } = drill
  return (
    <Link
      href={`/training/${slug}`}
      className="block rounded-lg border border-deepblue/15 bg-white p-5 hover:border-deepblue/40 transition-colors"
    >
      <p className="text-xs font-ui font-semibold uppercase tracking-widest text-orange mb-1">
        {frontmatter.drillId}
      </p>
      <h3 className="font-heading text-deepblue mb-2 text-lg">{frontmatter.title}</h3>
      <p className="text-sm text-brown/70 font-body leading-relaxed line-clamp-2">
        {frontmatter.description}
      </p>
      <p className="mt-3 text-xs text-deepblue/60 font-ui">
        {frontmatter.duration} · {frontmatter.players}
      </p>
    </Link>
  )
}
