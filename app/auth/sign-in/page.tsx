/**
 * /auth/sign-in — Magic-link sign-in page.
 * Magic-link only; no password, no OAuth at v1 (brief §3).
 */
import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import SignInForm from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign in — StunpreX Community',
  description: 'Sign in to the StunpreX community with a magic link. No password required.',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="bg-mint">
        <section className="container-site py-16 md:py-20">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center">
              <h1 className="font-display text-2xl font-bold text-deepblue mb-2">
                Sign in
              </h1>
              <p className="text-brown/70 font-body text-sm">
                Enter your email and we&rsquo;ll send you a sign-in link.
                No password required.
              </p>
            </div>
            <SignInForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
