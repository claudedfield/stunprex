import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { BenefitsGrid } from '@/components/BenefitsGrid';
import { PullQuote } from '@/components/PullQuote';
import { Pillars } from '@/components/Pillars';
import { Methodology } from '@/components/Methodology';
import { AudienceHubs } from '@/components/AudienceHubs';
import { JoinCommunity } from '@/components/JoinCommunity';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'StunpreX — A methodology-first hub for individual soccer player development',
  description:
    'Develop the player, not the position. Built for players, parents, and coaches who take long-horizon development seriously.',
  openGraph: {
    title: 'StunpreX — A methodology-first hub for individual soccer player development',
    description:
      'Develop the player, not the position. Built for players, parents, and coaches who take long-horizon development seriously.',
    url: 'https://www.stunprex.com',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StunpreX — A methodology-first hub for individual soccer player development',
    description:
      'Develop the player, not the position. Built for players, parents, and coaches who take long-horizon development seriously.',
  },
};

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
