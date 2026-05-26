/**
 * /auth/sign-up — Sign-up page.
 * Since Supabase magic-link creates accounts automatically,
 * this page simply redirects to sign-in with a friendly explanation.
 * Keeping the /auth/sign-up route for UX clarity (nav links, error redirects).
 */
import { redirect } from 'next/navigation'

export default function SignUpPage() {
  // No separate sign-up flow — magic-link creates accounts on first use.
  // Redirect to sign-in with context parameter so the form can show a note.
  redirect('/auth/sign-in?context=signup')
}
