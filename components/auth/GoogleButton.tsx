/**
 * "Continue with Google" on the sign-in and sign-up pages. Rendered only while Google sign-in is
 * open (lib/auth/google.ts). A plain form: it works before the page's script has loaded.
 */
import { signInWithGoogle } from '@/lib/community/actions'
import { googleSignInOpen } from '@/lib/auth/google'

export function GoogleButton({ next }: { next: string }) {
  if (!googleSignInOpen()) return null
  return (
    <div className="mb-5" data-google-signin>
      <form id="google-signin" action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded border border-deepblue/25 bg-white px-4 py-2.5 font-ui text-sm font-medium text-brown transition-colors hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Continue with Google
        </button>
      </form>
      <p className="mt-2 text-center text-xs font-body text-brown/50">
        We take only your email address from Google, not your name or picture.
      </p>
      <div className="mt-5 flex items-center gap-3 text-xs font-ui text-brown/40" aria-hidden="true">
        <span className="h-px flex-1 bg-deepblue/15" />or with your email<span className="h-px flex-1 bg-deepblue/15" />
      </div>
    </div>
  )
}
