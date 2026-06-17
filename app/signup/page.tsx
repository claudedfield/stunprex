/**
 * /signup — canonical sign-up entry point (matches /signin pattern).
 * Renders the community sign-up form directly; /auth/sign-up is the implementation.
 */
import { permanentRedirect } from 'next/navigation';

export default function Page() {
  permanentRedirect('/auth/sign-up');
}
