import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

const DESC = "Support your child's football development without the harms of modern youth football. A long-horizon, player-centred guide for parents.";

export const metadata: Metadata = {
  title: 'For Parents',
  description: DESC,
  openGraph: {
    title: 'For Parents — StunpreX',
    description: DESC,
    url: 'https://www.stunprex.com/for-parents',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Parents — StunpreX',
    description: DESC,
  },
};

export default function Page() {
  return (
    <ComingSoon
      section="For parents"
      blurb="A dedicated path for parents supporting a player's development. Coming soon — for now, browse the blog and the community."
      shipsIn="Coming soon"
    />
  );
}
