/**
 * /auth/sign-up — Join StunpreX Community.
 * Same magic-link mechanism as sign-in; different framing + newsletter opt-in hint.
 * Profile (display_name) is completed at /community/welcome after first sign-in.
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import SignUpForm from './SignUpForm'

export const metadata: Metadata = {
  title: 'Join the community — StunpreX',
  description: 'Create a free StunpreX account to ask questions, share observations, and connect with players, parents, and coaches.',
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return (
    <>
      <Header />
      <main className="bg-mint">
        <section className="container-site py-16 md:py-20">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <h1 className="font-display text-2xl font-bold text-deepblue mb-2">
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
                href="/auth/sign-in"
                className="text-deepblue underline underline-offset-2 hover:text-deepblue/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
              >
                Sign in
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
