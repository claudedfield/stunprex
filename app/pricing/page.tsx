import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata = {
  title: 'Pricing',
  description: 'StunpreX — Free, Starter, Pro, and Elite tiers. Affordability is a Codex stance.',
};

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    pitch: 'Read the Codex. Try a drill. See what individual development actually looks like.',
    features: [
      'Public Codex access',
      'Selected free articles & drills',
      'Newsletter (free tier)',
      'Try Before You Join interactive drill',
    ],
    cta: 'Start free',
    href: '/signup',
  },
  {
    name: 'Starter',
    price: '$9.99',
    cadence: 'per month',
    pitch: 'For players ready to train deliberately.',
    features: [
      'Full drill library access',
      'Capacity-tagged search',
      'XP, badges, streak counter',
      'Member newsletter',
    ],
    cta: 'Choose Starter',
    href: '/signup?tier=starter',
  },
  {
    name: 'Pro',
    price: '$19.99',
    cadence: 'per month',
    pitch: 'For players who want the Coach.',
    featured: true,
    features: [
      'Everything in Starter',
      'Elite Coach chat (the methodology, in dialogue)',
      'Member-gated drill videos',
      'Pro-tier newsletter',
      'Pro Breakdown video series',
    ],
    cta: 'Choose Pro',
    href: '/signup?tier=pro',
  },
  {
    name: 'Elite',
    price: '$29.99',
    cadence: 'per month',
    pitch: 'For players, parents, and coaches at decision points.',
    features: [
      'Everything in Pro',
      'Contract Review service',
      'Premium newsletter',
      'Live Q&A with coaches',
      'Priority access to new pillars',
    ],
    cta: 'Choose Elite',
    href: '/signup?tier=elite',
  },
];

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <section className="container-site py-20 md:py-24">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Pricing
          </p>
          <h1 className="font-heading max-w-3xl">Four tiers. No tricks.</h1>
          <p className="mt-6 max-w-2xl text-brown/80 text-lg">
            Affordability is a stance, not a marketing line. StunpreX is not a
            premium-luxury product. The free tier is genuinely usable. The cancel path is on
            the same screen as the upgrade path.
          </p>
        </section>

        <section className="container-site pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-lg p-7 flex flex-col
                  ${t.featured
                    ? 'bg-deepblue text-white border-2 border-orange shadow-lg'
                    : 'bg-white border border-deepblue/15'}`}
              >
                <h3 className={`font-heading mb-1 ${t.featured ? 'text-white' : 'text-deepblue'}`}>
                  {t.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`font-heading text-4xl ${t.featured ? 'text-orange' : 'text-deepblue'}`}>
                    {t.price}
                  </span>
                  <span className={`text-sm ${t.featured ? 'text-white/70' : 'text-brown/60'}`}>
                    {t.cadence}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${t.featured ? 'text-white/85' : 'text-brown/80'}`}>
                  {t.pitch}
                </p>
                <ul className={`space-y-2 text-sm mb-8 flex-1 ${t.featured ? 'text-white/90' : 'text-brown/80'}`}>
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${t.featured ? 'bg-orange' : 'bg-deepblue'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className={t.featured ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-brown/60 italic max-w-prose">
            Pricing is locked at the structural level (Free / Starter $9.99 / Pro $19.99 /
            Elite $29.99) and pending real-world validation. Tiers are cancellable anytime;
            VAT applied where required.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
