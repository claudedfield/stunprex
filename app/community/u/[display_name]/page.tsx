/**
 * /community/u/[display_name] — Public member profile page.
 * Public read. Shows member bio, question count, answer count, recent questions.
 * Canonical: https://stunprex.com/community/u/[display_name]
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMemberProfile } from '@/lib/community/queries'
import { CATEGORY_LABELS } from '@/lib/types/community'
import type { QuestionCategory } from '@/lib/types/community'

interface ProfilePageProps {
  params: Promise<{ display_name: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { display_name } = await params
  const profile = await getMemberProfile(decodeURIComponent(display_name))
  if (!profile) return { title: 'Member not found — StunpreX Community' }
  return {
    title: `${profile.display_name} — StunpreX Community`,
    description:
      profile.bio ??
      `${profile.display_name} is a member of the StunpreX football development community.`,
    alternates: {
      canonical: `https://stunprex.com/community/u/${encodeURIComponent(profile.display_name)}`,
    },
  }
}

export default async function MemberProfilePage({ params }: ProfilePageProps) {
  const { display_name } = await params
  const profile = await getMemberProfile(decodeURIComponent(display_name))
  if (!profile) notFound()

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
            {profile.display_name}
          </nav>

          <div className="flex items-start gap-4 mt-4">
            {/* Avatar */}
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
              </div>

              {profile.bio && (
                <p className="mt-1 text-sm font-body text-brown/70 leading-relaxed max-w-lg">
                  {profile.bio}
                </p>
              )}

              <p className="mt-1.5 text-xs font-ui text-brown/40">
                Member since {joinedDate}
                {' · '}
                {profile.question_count} question{profile.question_count !== 1 ? 's' : ''}
                {' · '}
                {profile.answer_count} answer{profile.answer_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        {/* Recent questions */}
        <section>
          <h2 className="font-ui text-sm font-semibold text-deepblue mb-3">
            Recent questions
          </h2>

          {profile.recent_questions.length === 0 ? (
            <p className="text-sm font-body text-brown/50">No questions yet.</p>
          ) : (
            <ul className="space-y-2" role="list">
              {profile.recent_questions.map((q) => (
                <li key={q.id} className="flex items-start gap-3">
                  <Link
                    href={`/community/category/${q.category}`}
                    className="flex-shrink-0 rounded bg-deepblue/8 px-1.5 py-0.5 text-xs font-ui text-deepblue/70 hover:bg-deepblue/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                  >
                    {CATEGORY_LABELS[q.category as QuestionCategory] ?? q.category}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/community/${q.slug}`}
                      className="text-sm font-body font-medium text-brown hover:text-deepblue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
                    >
                      {q.title}
                    </Link>
                    <span className="ml-2 text-xs font-ui text-brown/35">
                      {new Date(q.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {profile.question_count > profile.recent_questions.length && (
            <p className="mt-3 text-xs font-ui text-brown/40">
              Showing {profile.recent_questions.length} of {profile.question_count} questions.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
