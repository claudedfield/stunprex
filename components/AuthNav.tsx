'use client'
/**
 * AuthNav: the header's sign-in state (owner report, 4 Oct 2026; D-AUTH-01).
 *
 * Signed out: "Sign in". Signed in: the member's display name, linking to their profile, and
 * "Sign out". The header is built ahead of time, so the state is read in the browser from
 * /api/auth/session; until it is known nothing is shown, so the header never states something untrue
 * (it used to say "Sign in" to a signed-in member, who then landed on /community and read that as a
 * failed sign-in).
 */
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/community/actions'

type State = { known: false } | { known: true; name: string | null }

export function AuthNav({ variant = 'desktop', onNavigate }: { variant?: 'desktop' | 'mobile'; onNavigate?: () => void }) {
  const [state, setState] = useState<State>({ known: false })
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let alive = true
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!alive) return
        const u = s?.user as { display_name?: string; name?: string } | undefined
        setState({ known: true, name: u ? (u.display_name ?? u.name ?? 'Member') : null })
      })
      .catch(() => alive && setState({ known: true, name: null }))
    return () => { alive = false }
  }, [])

  const text = variant === 'desktop'
    ? 'font-ui text-sm text-brown/70 hover:text-deepblue transition-colors'
    : 'block font-ui text-base text-deepblue py-2'
  const wrap = variant === 'desktop' ? 'hidden lg:flex items-center gap-3' : 'flex flex-col'

  if (!state.known) return <span className={wrap} aria-hidden="true" data-auth-nav="loading" />
  if (state.name === null) {
    return (
      <span className={wrap} data-auth-nav="signed-out">
        <Link href="/signin" className={text} onClick={onNavigate}>Sign in</Link>
      </span>
    )
  }
  return (
    <span className={wrap} data-auth-nav="signed-in">
      <Link href="/community/u/me" className={text} onClick={onNavigate} title="Your profile">{state.name}</Link>
      <button type="button" className={text} disabled={pending}
        onClick={() => startTransition(async () => { await signOut() })}>
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </span>
  )
}
