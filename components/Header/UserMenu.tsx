'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const displayName = user.name || user.email?.split('@')[0] || 'You'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-deepblue/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar circle with initial */}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deepblue text-sm font-medium text-white select-none">
          {initial}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <button
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-deepblue/15 bg-white py-1 shadow-lg"
          >
            {/* Identity block */}
            <div className="border-b border-deepblue/10 px-4 py-3">
              <p className="font-ui text-sm font-medium text-deepblue truncate">
                {displayName}
              </p>
              {user.email && (
                <p className="font-body text-xs text-brown/60 truncate mt-0.5">
                  {user.email}
                </p>
              )}
            </div>

            {/* Menu items */}
            <a
              href="/community/u/me"
              role="menuitem"
              className="block px-4 py-2 text-sm font-ui text-brown/80 hover:bg-mint/50 hover:text-deepblue focus-visible:outline-none focus-visible:bg-mint/50"
            >
              My profile
            </a>
            <a
              href="/community/ask"
              role="menuitem"
              className="block px-4 py-2 text-sm font-ui text-brown/80 hover:bg-mint/50 hover:text-deepblue focus-visible:outline-none focus-visible:bg-mint/50"
            >
              Ask a question
            </a>

            {/* Sign out */}
            <div className="border-t border-deepblue/10 mt-1 pt-1">
              <button
                role="menuitem"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block w-full text-left px-4 py-2 text-sm font-ui text-brown/80 hover:bg-mint/50 hover:text-deepblue focus-visible:outline-none focus-visible:bg-mint/50"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
