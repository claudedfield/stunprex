import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BenefitsGrid } from '@/components/BenefitsGrid';
import { PullQuote } from '@/components/PullQuote';
import { Pillars } from '@/components/Pillars';
import { Methodology } from '@/components/Methodology';
import { AudienceHubs } from '@/components/AudienceHubs';
import { JoinCommunity } from '@/components/JoinCommunity';
import { NewsletterCapture } from '@/components/NewsletterCapture';
import { Footer } from '@/components/Footer';

// Self-referential canonical (D-WEB-17). Declared here rather than in the root
// layout: a canonical on the layout would be inherited by every page that does not
// override it, pointing the whole site at the home page.
export const metadata = {
  alternates: { canonical: 'https://stunprex.com/' },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <BenefitsGrid />
        <PullQuote />
        <Pillars />
        <Methodology />
        <AudienceHubs />
        <JoinCommunity />
        <NewsletterCapture source="home" />
      </main>
      <Footer />
    </>
  );
}
