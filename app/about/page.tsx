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
      <main id="main-content">
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
              The methodology rests on the Capacities Framework, age-band pathways from 5–8
              to 21+, a set of on-pitch operating principles, and a clear list of the
              patterns we refuse to build around — see <Link href="/methodology">Methodology</Link>
              for the plain-language version.
            </p>
            <p>
              StunpreX is gender-neutral by design and serves four audiences distinctly:
              players at every age band, co-buyer parents, multiplier coaches, and the wider
              football community. Multilingual: English, Spanish, Mandarin, Hungarian.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link href="/methodology" className="btn-primary">See what we believe</Link>
            <Link href="/" className="btn-secondary">Back to home</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
