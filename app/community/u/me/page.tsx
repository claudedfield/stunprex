/**
 * /community/u/me — Authenticated user's own profile page.
 * Auth-gated. Shows their posts, allows profile editing.
 */
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentProfile, getPosts } from '@/lib/community/queries'
import UserAvatar from '@/components/community/UserAvatar'
import PostCard from '@/components/community/PostCard'

export const metadata: Metadata = {
  title: 'My Profile — StunpreX Community',
  robots: { index: false, follow: false },
}

export default async function MyProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/auth/sign-in?next=/community/u/me')

  const { posts } = await getPosts({ authorId: profile.id, perPage: 50 })

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile header */}
        <header className="mb-8 flex items-start gap-4">
          <UserAvatar
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-deepblue">
              {profile.display_name}
            </h1>
            {profile.bio && (
              <p className="mt-1 text-brown/70 font-body text-sm max-w-prose">{profile.bio}</p>
            )}
            <p className="mt-2 text-xs text-brown/40 font-ui">{profile.email}</p>
          </div>
          {/* Profile edit — Session 5 */}
          <a
            href="/community/u/me/edit"
            className="rounded border border-deepblue/20 px-3 py-1.5 text-xs font-ui font-medium text-brown hover:text-deepblue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          >
            Edit profile
          </a>
        </header>

        {/* My posts */}
        <section aria-labelledby="my-posts-heading">
          <h2 id="my-posts-heading" className="font-display text-base font-semibold text-deepblue mb-4">
            My discussions ({posts.length})
          </h2>
          {posts.length === 0 ? (
            <div className="rounded-lg border border-deepblue/10 bg-white p-6 text-center">
              <p className="text-brown/50 font-body text-sm mb-3">No discussions yet.</p>
              <a
                href="/community/new"
                className="inline-block rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
              >
                Start a discussion
              </a>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {posts.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
