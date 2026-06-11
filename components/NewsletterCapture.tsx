'use client';

// Newsletter capture — live form, double opt-in via /api/newsletter/subscribe.
// No countdown, no fake urgency, no fabricated subscriber count. Codex-aligned.
// NOT mounted anywhere yet — placement is Dezső's decision.

import { useState, type FormEvent } from 'react';

type FormState = 'idle' | 'submitting' | 'done';

interface NewsletterCaptureProps {
  /** Where this form lives, recorded as newsletter_subscribers.source. */
  source?: string;
}

export function NewsletterCapture({ source = 'site' }: NewsletterCaptureProps) {
  const [state, setState] = useState<FormState>('idle');
  const [email, setEmail] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'submitting') return;
    setState('submitting');

    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
    } catch {
      // The API answers generically by design; a network failure still lands
      // on the same honest message — the confirm email is the real gate.
    }

    setState('done');
  }

  return (
    <section className="py-20 md:py-24 bg-mint">
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Newsletter
          </p>
          <h2 className="font-heading">Letters on individual development</h2>
          <p className="mt-5 text-brown/80 text-lg leading-relaxed">
            Methodology letters. No hype, unsubscribe anytime.
          </p>

          {state === 'done' ? (
            <p className="mt-8 text-brown text-lg" role="status">
              Check your inbox — if that address can be subscribed, a
              confirmation email is on its way.
            </p>
          ) : (
            <form
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
              onSubmit={handleSubmit}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 max-w-sm px-5 py-3 rounded-md border border-deepblue/25 bg-white font-body text-brown focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={state === 'submitting'}
              >
                {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}

          <p className="mt-3 text-xs text-brown/60 italic">
            Double opt-in — we only write to you after you confirm. We store
            nothing beyond your email address.
          </p>
        </div>
      </div>
    </section>
  );
}
