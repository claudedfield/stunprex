/**
 * Shown on the sign-in and sign-up pages to a visitor who is already signed in (owner report,
 * 4 Oct 2026): no silent redirect and no form, only what is true and the two things they can do.
 */
import Link from 'next/link'
import { signOut } from '@/lib/community/actions'

export function SignedInNotice({ name, next }: { name: string; next: string }) {
  return (
    <div data-signed-in-notice className="rounded-lg border border-deepblue/20 bg-white p-6 text-center space-y-4">
      <p className="font-body text-brown">
        You are signed in as <strong>{name}</strong>.
      </p>
      <p className="font-body text-sm">
        <Link href={next} className="text-deepblue underline underline-offset-2">
          {next === '/community' ? 'Go to the community' : 'Continue'}
        </Link>
      </p>
      <form action={signOut}>
        <button type="submit" className="font-ui text-sm text-brown/70 underline underline-offset-2 hover:text-deepblue">
          Sign out
        </button>
      </form>
    </div>
  )
}
