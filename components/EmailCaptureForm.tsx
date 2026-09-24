/**
 * EmailCaptureForm: the newsletter's way in, to beehiiv (D-WEB-13, LEGAL-01c, 01d, 01b).
 *
 * No beehiiv script runs on any StunpreX page: the embed was measured to drop third-party
 * cookies on our origin (D-WEB-13), which would make /cookies false.
 *
 * LEGAL-01c: no email in any URL. Until 24 Sep this was a GET form, so the typed address
 * travelled in the query string and sat in browser history and logs. beehiiv's hosted page
 * answers any non-browser client with a Cloudflare challenge (HTTP 403, GET and POST alike),
 * so a cross-site POST could not be verified without a real subscription. The reader now types
 * the address on beehiiv's own page, where beehiiv is first party. Attribution stays in the
 * link and carries no personal data. The API route replaces this when beehiiv issues a key.
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
  const href = `${BEEHIIV_SUBSCRIBE}?${new URLSearchParams({ utm_source: 'stunprex.com', utm_medium: source })}`;
  const small = isInline ? 'text-xs text-white/70' : 'text-xs text-brown/60';

  return (
    <div data-newsletter className={`flex flex-col items-center gap-2 ${className}`}>
      <a
        href={href}
        className={
          isInline
            ? 'rounded-md bg-orange px-4 py-2 text-sm font-ui font-medium text-white transition-colors hover:bg-orange/90'
            : 'btn-primary'
        }
      >
        Subscribe on beehiiv
      </a>
      {/* LEGAL-01b: the newsletter is for readers 16 and over. */}
      <p className={small}>For readers 16 and over. Parents are welcome to subscribe with their own address.</p>
      {/* LEGAL-01d: the privacy link sits next to every place that takes personal data. */}
      <p className={small}>
        How we use your data:{' '}
        <a href="/privacy" className="underline underline-offset-2">
          Privacy Notice
        </a>
        .
      </p>
    </div>
  );
}
