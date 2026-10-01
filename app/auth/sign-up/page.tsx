/**
 * /auth/sign-up — Join StunpreX Community.
 * Same magic-link mechanism as sign-in; different framing + newsletter opt-in hint.
 * Profile (display_name) is completed at /community/welcome after first sign-in.
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import SignUpForm from './SignUpForm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { safeNext } from '@/lib/auth/next'

export const metadata: Metadata = {
  title: { absolute: 'Join the community · StunpreX' },
  description: 'Create a free StunpreX account to ask questions, share observations, and connect with players, parents, and coaches.',
  robots: { index: false, follow: false },
}

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // A signed-in visitor has no use for this form: on to where they were going.
  const session = await auth()
  if (session?.user?.id) redirect(safeNext((await searchParams).next))
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="bg-mint flex items-center justify-center px-4 py-16 md:py-24 min-h-[60vh]"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-deepblue text-3xl mb-2">
              Join the community
            </h1>
            <p className="text-brown/70 font-body text-sm max-w-xs mx-auto">
              A free space for players, parents, and coaches who care about
              long-horizon football development.
            </p>
          </div>
          <SignUpForm />
          <p className="mt-4 text-center text-xs text-brown/40 font-body">
            Already a member?{' '}
            <a
              href="/signin"
              className="text-deepblue underline underline-offset-2 hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
            >
              Sign in
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
