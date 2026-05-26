/**
 * /community/u/[display_name] — Public user profile page.
 * Shows bio, avatar, and the user's published posts.
 * Indexable (noindex only if user opts out — opt-out UI in Session 5).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProfileByDisplayName, getPosts } from '@/lib/community/queries'
import UserAvatar from '@/components/community/UserAvatar'
import PostCard from '@/components/community/PostCard'

interface UserProfilePageProps {
  params: Promise<{ display_name: string }>
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { display_name } = await params
  const profile = await getProfileByDisplayName(display_name)
  if (!profile) return { title: 'Not found — StunpreX Community' }

  return {
    title: `${profile.display_name} — StunpreX Community`,
    description: profile.bio ?? `${profile.display_name}'s discussions on StunpreX.`,
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { display_name } = await params
  const profile = await getProfileByDisplayName(display_name)

  if (!profile) notFound()

  const { posts } = await getPosts({ authorId: profile.id, perPage: 20 })

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
          <div>
            <h1 className="font-display text-2xl font-bold text-deepblue">
              {profile.display_name}
            </h1>
            {profile.bio && (
              <p className="mt-1 text-brown/70 font-body text-sm max-w-prose">{profile.bio}</p>
            )}
          </div>
        </header>

        {/* User's posts */}
        <section aria-labelledby="posts-heading">
          <h2 id="posts-heading" className="font-display text-base font-semibold text-deepblue mb-4">
            Discussions
          </h2>
          {posts.length === 0 ? (
            <p className="text-brown/50 font-body text-sm">No discussions yet.</p>
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
