import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BenefitsGrid } from '@/components/BenefitsGrid';
import { PullQuote } from '@/components/PullQuote';
import { Pillars } from '@/components/Pillars';
import { Methodology } from '@/components/Methodology';
import { AudienceHubs } from '@/components/AudienceHubs';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BenefitsGrid />
        <PullQuote />
        <Pillars />
        <Methodology />
        <AudienceHubs />
        {/* NewsletterCapture is intentionally unmounted — live form now,
            placement is Dezső's decision. */}
      </main>
      <Footer />
    </>
  );
}
