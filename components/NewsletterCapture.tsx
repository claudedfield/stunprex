// Newsletter capture — working form (stores to Postgres via /api/newsletter).
// No countdown, no fake urgency, no fabricated subscriber count. Codex-aligned.
import { EmailCaptureForm } from './EmailCaptureForm';

export function NewsletterCapture() {
  return (
    <section className="py-20 md:py-24 bg-mint">
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Newsletter
          </p>
          <h2 className="font-heading">A weekly dispatch on individual development</h2>
          <p className="mt-5 text-brown/80 text-lg leading-relaxed">
            Methodology pieces, a drill of the week, and the convictions behind them. No
            hype. Unsubscribe anytime.
          </p>
          <EmailCaptureForm source="home" variant="block" className="mt-8" />
          <p className="mt-3 text-xs text-brown/60 italic">
            We&rsquo;ll send the first issue once we&rsquo;re ready, not before.
          </p>
        </div>
      </div>
    </section>
  );
}
