/**
 * NewsletterCapture — the single wrapper for newsletter placement and copy.
 *
 * Restored in D-WEB-13 once beehiiv went live. D-WEB-05 had removed both capture
 * points under the D2/D8 deferral, when there was nowhere for an address to go.
 * Keeping placement and copy here means the two capture points cannot drift apart.
 *
 * The field itself is EmailCaptureForm, which posts to beehiiv's hosted page
 * rather than loading beehiiv's embed script. See that file for the cookie
 * measurement behind that choice.
 *
 * Copy rule: no invented social proof. We have one subscriber, and manufactured
 * numbers are a refused pattern.
 */
import type { ReactNode } from 'react';
import { EmailCaptureForm } from './EmailCaptureForm';

interface Props {
  /** Placement label, forwarded to beehiiv for attribution. */
  source?: string;
  /** 'section' = full-width band (home); 'card' = boxed (end of an article). */
  variant?: 'section' | 'card';
  /**
   * Optional secondary action under the card, rendered as quiet text rather than
   * a second button. Used at the end of an article to keep the community
   * reachable (D-WEB-05's intent) without giving it equal visual weight to the
   * newsletter, which is now the primary distribution action (D-WEB-13-FU).
   */
  footer?: ReactNode;
}

const HEADING = 'A weekly dispatch on individual development';
const LINE =
  'Methodology pieces and a drill of the week. No hype, and you can unsubscribe anytime.';
const CONFIRM_NOTE = 'Double opt-in: beehiiv sends a confirmation email before anything else.';

export function NewsletterCapture({ source = 'home', variant = 'section', footer }: Props) {
  if (variant === 'card') {
    return (
      <div className="mt-12 rounded-xl border border-deepblue/15 bg-deepblue/[0.03] p-6 sm:p-8 text-center">
        <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">Newsletter</p>
        <h2 className="font-heading text-deepblue text-xl mb-2">{HEADING}</h2>
        <p className="text-brown/75 font-body text-sm mb-5 max-w-md mx-auto">{LINE}</p>
        <EmailCaptureForm source={source} variant="block" />
        <p className="mt-3 text-xs text-brown/60 italic">{CONFIRM_NOTE}</p>
        {footer ? (
          <p className="mt-5 border-t border-deepblue/10 pt-4 font-ui text-sm text-brown/70">
            {footer}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <section className="py-20 md:py-24 bg-mint">
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">Newsletter</p>
          <h2 className="font-heading">{HEADING}</h2>
          <p className="mt-5 text-brown/80 text-lg leading-relaxed">{LINE}</p>
          <EmailCaptureForm source={source} variant="block" className="mt-8" />
          <p className="mt-3 text-xs text-brown/60 italic">{CONFIRM_NOTE}</p>
        </div>
      </div>
    </section>
  );
}
