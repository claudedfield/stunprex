/**
 * UserHandle — inline author name linked to their profile.
 * Compact; used inside cards and detail views.
 */
import Link from 'next/link'

interface UserHandleProps {
  displayName: string
  /** Show "mod" or "admin" badge next to the name */
  role?: string
}

export default function UserHandle({ displayName, role }: UserHandleProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Link
        href={`/community/u/${displayName}`}
        className="font-ui text-sm font-medium text-deepblue hover:text-deepblue/75 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
      >
        {displayName}
      </Link>
      {(role === 'moderator' || role === 'admin') && (
        <span className="rounded bg-deepblue/10 px-1.5 py-0.5 text-[10px] font-ui font-semibold text-deepblue uppercase tracking-wide">
          {role === 'admin' ? 'admin' : 'mod'}
        </span>
      )}
    </span>
  )
}
