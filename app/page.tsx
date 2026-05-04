import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BenefitsGrid } from '@/components/BenefitsGrid';
import { Pillars } from '@/components/Pillars';
import { Methodology } from '@/components/Methodology';
import { AudienceHubs } from '@/components/AudienceHubs';
import { NewsletterCapture } from '@/components/NewsletterCapture';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BenefitsGrid />
        <Pillars />
        <Methodology />
        <AudienceHubs />
        <NewsletterCapture />
      </main>
      <Footer />
    </>
  );
}
