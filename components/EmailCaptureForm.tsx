/**
 * EmailCaptureForm: the newsletter's way in (D-WEB-13, LEGAL-01c, 01d, 01b; D-NEWS-01).
 *
 * Since D-NEWS-01 (28 Sep 2026) the newsletter is our own: the button leads to /newsletter, where
 * the reader gives a name and an email by POST (never in a URL, LEGAL-01c) and confirms by email.
 * beehiiv is retired. This block is built ahead of time, so it links to the page rather than holding
 * the form: /newsletter is rendered per request and shows the form once sign-ups are open.
 * No third-party script, no tracking.
 */

interface Props {
  /** Placement, passed as ?from= so the sign-up records which block it came from. */
  source?: string;
  /** 'block' = large centred; 'inline' = compact. */
  variant?: 'block' | 'inline';
  className?: string;
}

export function EmailCaptureForm({ source = 'site', variant = 'block', className = '' }: Props) {
  const isInline = variant === 'inline';
  const href = `/newsletter?${new URLSearchParams({ from: source })}`;
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
        Subscribe
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
