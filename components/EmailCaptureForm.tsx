/**
 * EmailCaptureForm — newsletter capture, wired to beehiiv (D-WEB-13).
 *
 * PATTERN B, and the reason matters. The beehiiv embed script was measured before
 * any UI was written: loading it drops third-party cookies on our origin. Its form
 * iframe sets `_subscribe_forms_session` plus Cloudflare's `__cf_bm`
 * (Domain=beehiiv.com, SameSite=None), so shipping the embed would have made
 * /cookies false, which our e2e legal spec fails on by design.
 *
 * So there is no beehiiv script on any StunpreX page. This is a plain first-party
 * form that GETs to beehiiv's own hosted subscribe page, carrying the address the
 * visitor typed. A cookie is only ever set once the visitor is on beehiiv's site,
 * where beehiiv is first party and its own policy applies.
 *
 * No JavaScript is required: it is a native GET form, so it works with scripting
 * disabled. Swap this for the API route once beehiiv issues an API key.
 */

const BEEHIIV_SUBSCRIBE = 'https://stunprex.beehiiv.com/subscribe';

interface Props {
  /** Placement, forwarded to beehiiv as utm_medium for attribution. */
  source?: string;
  /** 'block' = large centred; 'inline' = compact. */
  variant?: 'block' | 'inline';
  className?: string;
}

export function EmailCaptureForm({ source = 'site', variant = 'block', className = '' }: Props) {
  const isInline = variant === 'inline';

  return (
    <form
      action={BEEHIIV_SUBSCRIBE}
      method="get"
      className={
        isInline
          ? `flex flex-col gap-2 ${className}`
          : `flex flex-col sm:flex-row gap-3 justify-center ${className}`
      }
    >
      {/* Attribution without beehiiv's attribution.js, which is another third-party script. */}
      <input type="hidden" name="utm_source" value="stunprex.com" />
      <input type="hidden" name="utm_medium" value={source} />

      <label htmlFor={`nl-email-${source}`} className="sr-only">
        Email address
      </label>
      <input
        id={`nl-email-${source}`}
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="your@email.com"
        className={
          isInline
            ? 'w-full rounded-md border border-white/25 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-orange/50'
            : 'flex-1 max-w-sm px-5 py-3 rounded-md border border-deepblue/25 bg-white font-body text-brown focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange'
        }
      />
      <button
        type="submit"
        className={
          isInline
            ? 'rounded-md bg-orange px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90'
            : 'btn-primary'
        }
      >
        Subscribe
      </button>
    </form>
  );
}
