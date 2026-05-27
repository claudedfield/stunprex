import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BenefitsGrid } from '@/components/BenefitsGrid';
import { PullQuote } from '@/components/PullQuote';
import { Pillars } from '@/components/Pillars';
import { Methodology } from '@/components/Methodology';
import { AudienceHubs } from '@/components/AudienceHubs';
import { JoinCommunity } from '@/components/JoinCommunity';
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
        <JoinCommunity />
      </main>
      <Footer />
    </>
  );
}
