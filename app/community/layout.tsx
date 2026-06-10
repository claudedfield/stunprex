/**
 * /community/* layout — wraps every community route in the standard site Header + Footer.
 * Individual page <main> wrappers remain (they handle content width + background).
 */
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
