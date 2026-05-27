/**
 * /community/u/me — Authenticated user's own profile page.
 * Auth-gated. Shows their Q&A activity + inline profile edit form.
 * Redirects to sign-in if not authenticated.
 * robots: noindex (personal account page).
 */
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { getMemberProfile } from '@/lib/community/queries'
import { updateProfile } from '@/lib/community/actions'
import { CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory } from '@/lib/types/community'

export const metadata: Metadata = {
  title: 'My profile — StunpreX Community',
  robots: { index: false, follow: false },
}

// ─── Inline edit form (server action bound) ───────────────────────────────────

function EditProfileForm({
  bio,
  avatarUrl,
}: {
  bio: string | null
  avatarUrl: string | null
}) {
  return (
    <form action={async (fd) => { await updateProfile(fd) }} className="space-y-4">
      <div>
        <label
          htmlFor="me-bio"
          className="block font-ui text-xs font-medium text-deepblue mb-1"
        >
          Bio{' '}
          <span className="text-brown/40 font-normal">— up to 280 characters</span>
        </label>
        <textarea
          id="me-bio"
          name="bio"
          defaultValue={bio ?? ''}
          maxLength={280}
          rows={3}
          placeholder="A few words about you or your work with the game…"
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-none"
        />
      </div>

      <div>
        <label
          htmlFor="me-avatar"
          className="block font-ui text-xs font-medium text-deepblue mb-1"
        >
          Avatar URL{' '}
          <span className="text-brown/40 font-normal">— HTTPS only</span>
        </label>
        <input
          id="me-avatar"
          name="avatar_url"
          type="url"
          defaultValue={avatarUrl ?? ''}
          placeholder="https://…"
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40"
        >
          Save changes
        </button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/sign-in?next=/community/u/me')

  const sessionUser = session.user as typeof session.user & {
    role?: string
    onboarded?: boolean
  }
  const displayName = (sessionUser as { display_name?: string }).display_name as string | undefined

  // getMemberProfile needs display_name — fall back to email prefix if not set yet
  const name = displayName ?? session.user.email?.split('@')[0] ?? ''
  const profile = name ? await getMemberProfile(name) : null

  if (!profile) {
    // Profile not found means onboarding hasn't completed — redirect to welcome
    redirect('/community/welcome')
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <nav className="mb-2 text-xs font-ui text-brown/45" aria-label="Breadcrumb">
            <Link
              href="/community"
              className="hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              Community
            </Link>
            <span className="mx-1.5" aria-hidden="true">/</span>
            My profile
          </nav>

          <div className="flex items-start gap-4 mt-4">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-14 w-14 rounded-full object-cover border border-deepblue/15 flex-shrink-0"
              />
            ) : (
              <div
                aria-hidden="true"
                className="h-14 w-14 rounded-full bg-deepblue/10 flex items-center justify-center flex-shrink-0"
              >
                <span className="font-display text-xl font-bold text-deepblue/40">
                  {profile.display_name[0].toUpperCase()}
                </span>
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold text-deepblue">
                  {profile.display_name}
                </h1>
                {(profile.role === 'moderator' || profile.role === 'admin') && (
                  <span className="rounded-full bg-deepblue/8 px-2 py-0.5 text-xs font-ui font-medium text-deepblue/70 capitalize">
                    {profile.role}
                  </span>
                )}
                <Link
                  href={`/community/u/${encodeURIComponent(profile.display_name)}`}
                  className="text-xs font-ui text-brown/40 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                >
                  View public profile →
                </Link>
              </div>
              <p className="mt-1 text-xs font-ui text-brown/40">
                Member since {joinedDate}
                {' · '}
                {profile.question_count} question{profile.question_count !== 1 ? 's' : ''}
                {' · '}
                {profile.answer_count} answer{profile.answer_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        {/* Edit form */}
        <section className="mb-10 rounded-lg border border-deepblue/15 bg-white/60 p-5">
          <h2 className="font-ui text-sm font-semibold text-deepblue mb-4">
            Edit profile
          </h2>
          <EditProfileForm bio={profile.bio} avatarUrl={profile.avatar_url} />
        </section>

        {/* Recent questions */}
        <section>
          <h2 className="font-ui text-sm font-semibold text-deepblue mb-3">
            Your questions
          </h2>

          {profile.recent_questions.length === 0 ? (
            <div className="text-sm font-body text-brown/50">
              <p>You haven&rsquo;t asked any questions yet.</p>
              <Link
                href="/community/ask"
                className="mt-2 inline-block text-deepblue underline hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
              >
                Ask your first question →
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2" role="list">
                {profile.recent_questions.map((q) => (
                  <li key={q.id} className="flex items-start gap-3">
                    <Link
                      href={`/community/category/${q.category}`}
                      className="flex-shrink-0 rounded bg-deepblue/8 px-1.5 py-0.5 text-xs font-ui text-deepblue/70 hover:bg-deepblue/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                    >
                      {CATEGORY_LABELS[q.category as QuestionCategory] ?? q.category}
                    </Link>
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                      <Link
                        href={`/community/${q.slug}`}
                        className="text-sm font-body font-medium text-brown hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded truncate"
                      >
                        {q.title}
                      </Link>
                      <Link
                        href={`/community/${q.slug}/edit`}
                        className="flex-shrink-0 text-xs font-ui text-brown/40 hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                      >
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              {profile.question_count > profile.recent_questions.length && (
                <p className="mt-3 text-xs font-ui text-brown/40">
                  Showing {profile.recent_questions.length} of {profile.question_count} questions.
                </p>
              )}
            </>
          )}
        </section>

        {/* Moderation shortcut for elevated roles */}
        {(profile.role === 'moderator' || profile.role === 'admin') && (
          <div className="mt-10 border-t border-deepblue/10 pt-4">
            <Link
              href="/community/moderation"
              className="text-sm font-ui text-deepblue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              Moderation queue →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
