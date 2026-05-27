/**
 * DEPRECATED — /community/new has been replaced by /community/ask.
 * This file cannot be deleted due to FUSE mount restrictions.
 * Permanent redirect to the new route.
 */
import { redirect } from 'next/navigation'

export default function OldNewPage() {
  redirect('/community/ask')
}
