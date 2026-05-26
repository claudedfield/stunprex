/**
 * /community/new — New post creation form.
 * Auth-gated: redirects to sign-in if not authenticated.
 * Preview step before publish (COO Q8 — posting friction is welcome).
 */
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentProfile } from '@/lib/community/queries'
import PostForm from './PostForm'

export const metadata: Metadata = {
  title: 'New Discussion — StunpreX Community',
  robots: { index: false, follow: false },
}

export default async function NewPostPage() {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/auth/sign-in?next=/community/new')
  }

  if (profile.is_banned) {
    redirect('/community?error=banned')
  }

  return (
    <main className="min-h-screen bg-mint">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-deepblue mb-2">
            New Discussion
          </h1>
          <p className="text-brown/60 font-body text-sm">
            Take a moment to preview before posting.
          </p>
        </header>
        <PostForm authorDisplayName={profile.display_name} />
      </div>
    </main>
  )
}
