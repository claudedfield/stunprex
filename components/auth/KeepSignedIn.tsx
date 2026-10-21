/**
 * "Keep me signed in on this device for 30 days" (Legal 03.4, the owner's sentence of 15 Oct 2026).
 * Never ticked by default. One box above both ways to sign in: it belongs to the Google form by its
 * `form` attribute (so it works before the page's script has loaded), and the email form reads it
 * when it sends.
 */
import { KEEP_LABEL, KEEP_BOX_ID } from '@/lib/auth/session-constants'

export function KeepSignedIn() {
  return (
    <div className="mb-5 rounded border border-deepblue/15 bg-white/60 px-4 py-3">
      <label htmlFor={KEEP_BOX_ID} className="flex items-start gap-3 font-body text-sm text-brown">
        <input id={KEEP_BOX_ID} type="checkbox" name="keep" value="1" form="google-signin"
          className="mt-0.5 h-4 w-4 accent-deepblue" />
        <span>
          {KEEP_LABEL}
          <span className="mt-1 block text-xs text-brown/60">
            Leave it unticked on a shared device: you are signed out when the browser closes, or after 24 hours.
          </span>
        </span>
      </label>
    </div>
  )
}
