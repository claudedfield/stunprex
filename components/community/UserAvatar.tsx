/**
 * UserAvatar — consistent identity display across community pages.
 * Shows avatar image if available; falls back to initials.
 * No external fetch for fallback — CSS-only initials avatar.
 */
import Image from 'next/image'

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

const SIZE_PX = { sm: 32, md: 40, lg: 56 }

export default function UserAvatar({ displayName, avatarUrl, size = 'md' }: UserAvatarProps) {
  const { container, text } = SIZE_CLASSES[size]
  const px = SIZE_PX[size]

  // Initials: first char of each word, max 2 chars
  const initials = displayName
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  if (avatarUrl) {
    return (
      <div className={`${container} rounded-full overflow-hidden flex-shrink-0 bg-deepblue/10`}>
        <Image
          src={avatarUrl}
          alt={displayName}
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

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
