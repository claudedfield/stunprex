// CapacityChips — renders primary (filled) and secondary (outlined) capacity chips.
// Chips are linked to the /capacities/[family] page.
// Style System §5.3; uses canonical Chip component.
import Link from 'next/link'
import { CAPACITY_FAMILY_TO_SLUG } from '@/lib/codex/themes'
import type { CapacityFamily } from '@/lib/types/drill'

interface Props {
  primary: string[];
  secondary: string[];
}

function toSlug(family: string): string | null {
  return CAPACITY_FAMILY_TO_SLUG[family as CapacityFamily] ?? null
}

export function CapacityChips({ primary, secondary }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {primary.map((cap) => {
        const slug = toSlug(cap)
        const cls = 'inline-flex items-center rounded-full bg-deepblue text-white px-3 py-1.5 text-xs font-ui transition-colors hover:bg-deepblue/80'
        return slug ? (
          <Link key={cap} href={`/capacities/${slug}`} className={cls}>{cap}</Link>
        ) : (
          <span key={cap} className={cls}>{cap}</span>
        )
      })}
      {secondary.map((cap) => {
        const slug = toSlug(cap)
        const cls = 'inline-flex items-center rounded-full border border-deepblue/20 bg-white text-brown/65 px-3 py-1.5 text-xs font-ui transition-colors hover:text-deepblue hover:border-deepblue/40'
        return slug ? (
          <Link key={cap} href={`/capacities/${slug}`} className={cls}>{cap}</Link>
        ) : (
          <span key={cap} className={cls}>{cap}</span>
        )
      })}
    </div>
  )
}
