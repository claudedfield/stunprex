'use client'
/**
 * The bio form on /community/u/me. A client component, so the result of a save is shown; its action
 * is the server action updateBio. (An inline function as a form's action in a server component
 * throws on render: that was the server error on this page, COO-DEV-0037.)
 */
import { useActionState } from 'react'
import { updateBio } from '@/lib/community/actions'

export function ProfileBioForm({ bio }: { bio: string | null }) {
  const [state, action, pending] = useActionState(updateBio, null)

  return (
    <form action={action} className="space-y-4" data-profile-form>
      <div>
        <label htmlFor="me-bio" className="block font-ui text-xs font-medium text-deepblue mb-1">
          Bio{' '}
          <span className="text-brown/40 font-normal">(up to 280 characters)</span>
        </label>
        <textarea
          id="me-bio"
          name="bio"
          defaultValue={bio ?? ''}
          maxLength={280}
          rows={3}
          placeholder="A few words about you or your work with the game…"
          className="w-full rounded border border-deepblue/20 px-3 py-2 font-body text-sm text-brown placeholder:text-brown/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 resize-none"
        />
      </div>

      {/* LEGAL-02.3: no picture field. Pictures come back through our own site with LEGAL-01g. */}

      <div className="flex items-center justify-end gap-3">
        {state?.success && (
          <p role="status" data-profile-result="saved" className="font-ui text-xs text-deepblue">Saved.</p>
        )}
        {state && !state.success && (
          <p role="alert" data-profile-result="error" className="font-ui text-xs text-red-700">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-deepblue px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
