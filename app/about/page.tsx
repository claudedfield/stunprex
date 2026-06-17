import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';

export const metadata = {
  title: 'About',
  description: 'About StunpreX — methodology-first soccer player development by DField Kft.',
};

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          eyebrow="About"
          title="Who is behind the methodology"
          lede="A methodology-first hub for individual football player development, built on the belief that complete players grow long-horizon — without the routine harms of modern youth football."
        />
        <section className="container-site py-14 max-w-3xl">
          <div className="space-y-6 text-brown/85 text-lg leading-relaxed">
            <p>
              StunpreX (Strive · Unleash · Progress · Excel) is a content-and-services
              product positioned as the masterclass for individual football player
              development. It is a project of <strong>DField Kft.</strong>, an engineering
              and contents company based in Hungary.
            </p>
            <p>
              StunpreX believes football greatness is built by deliberate training,
              disciplined habits, and the daily search for the better — practised long
              enough that ordinary players become uncommonly good.
            </p>
            <p>
              The methodology is captured in the <Link href="/codex">Codex</Link>: thirty-six
              convictions, the Capacities Framework, five age-band pathways from 5–8 to 21+,
              the Player Operating Principles, and an anti-patterns list — all defended in
              public.
            </p>
            <p>
              StunpreX is gender-neutral by design and serves four audiences distinctly:
              players (13–24), co-buyer parents, multiplier coaches, and the wider football
              community. Multilingual: English, Spanish, Mandarin, Hungarian.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/codex" className="btn-primary">Read the Codex</Link>
            <Link href="/" className="btn-secondary">Back to home</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
