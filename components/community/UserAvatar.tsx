/**
 * UserAvatar: consistent identity display across community pages.
 * LEGAL-02.3 (2 Oct 2026): initials only. A stored `avatar_url` points at another host, and loading
 * it would send every viewer's address there, so it is never rendered. LEGAL-01g later brings
 * pictures back through our own site. The prop stays so callers do not change.
 */

interface UserAvatarProps {
  displayName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-14 w-14', text: 'text-base' },
}

export default function UserAvatar({ displayName, size = 'md' }: UserAvatarProps) {
  const { container, text } = SIZE_CLASSES[size]

  // Initials: first char of each word, max 2 chars
  const initials = displayName
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      className={`${container} rounded-full flex-shrink-0 bg-deepblue/15 flex items-center justify-center`}
      aria-label={displayName}
    >
      <span className={`${text} font-ui font-semibold text-deepblue select-none`}>
        {initials}
      </span>
    </div>
  )
}
