/**
 * /auth/google-confirm (C1): a Google sign-in for an address that is not Gmail or Google Workspace
 * waits here until the person types the code we email to that address, once. Only the browser that
 * went to Google sees its address here (lib/auth/google-confirm.ts).
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { heldGoogleSignIn } from '@/lib/auth/google-confirm'
import { GoogleConfirmStep } from './GoogleConfirmStep'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Confirm your address · StunpreX' },
  robots: { index: false, follow: false },
}

export default async function GoogleConfirmPage() {
  const held = await heldGoogleSignIn()
  return (
    <>
      <Header />
      <main id="main-content" className="bg-mint flex items-center justify-center px-4 py-16 md:py-24 min-h-[60vh]">
        <div className="w-full max-w-md" data-google-confirm={held ? 'held' : 'expired'}>
          <h1 className="font-heading text-deepblue text-3xl mb-4 text-center">Confirm your address</h1>
          {held ? (
            <GoogleConfirmStep email={held.email} />
          ) : (
            <p className="font-body text-sm text-brown/80 text-center">
              This step has expired, or it was started in another browser.{' '}
              <Link href="/signin" className="text-deepblue underline">Start again from the sign-in page</Link>.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
