// Newsletter capture — placeholder form. Wired to Kit (ConvertKit) in Block 4.
// No countdown, no fake urgency, no fabricated subscriber count. Codex-aligned.

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
          <form
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            action="/api/newsletter"
            method="post"
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
              className="flex-1 max-w-sm px-5 py-3 rounded-md border border-deepblue/25 bg-white font-body text-brown focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange"
            />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-xs text-brown/60 italic">
            We&rsquo;ll send the first issue once we&rsquo;re ready, not before.
          </p>
        </div>
      </div>
    </section>
  );
}
