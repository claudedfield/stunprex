import { ComingSoon } from '@/components/ComingSoon';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imprint',
  description: 'Legal notice and company information for StunpreX, operated by DField Kft.',
  openGraph: {
    title: 'Imprint — StunpreX',
    description: 'Legal notice and company information for StunpreX, operated by DField Kft.',
    url: 'https://www.stunprex.com/imprint',
    siteName: 'StunpreX',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Imprint — StunpreX',
    description: 'Legal notice and company information for StunpreX, operated by DField Kft.',
  },
};
export default function Page() {
  return (
    <ComingSoon
      section="Imprint"
      blurb="Legal imprint for DField Kft. (Hungary) is in preparation. EU/DACH legal requirement — real content shipping shortly."
      shipsIn="Shortly"
    />
  );
}
