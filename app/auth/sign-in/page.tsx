/**
 * /auth/sign-in — Permanent redirect to canonical /signin.
 * Kept so inbound links and any cached Auth.js callbacks still resolve.
 */
import { permanentRedirect } from 'next/navigation'

export default function Page() {
  permanentRedirect('/signin')
}
