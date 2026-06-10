/**
 * /auth/* layout — wraps every auth route in the standard site Header + Footer.
 * Individual page <main> wrappers remain; the layout supplies chrome.
 */
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function AuthLayout({
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
