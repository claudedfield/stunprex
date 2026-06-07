import type { Metadata, Viewport } from 'next';
import { Mate, Play, Dosis, Noto_Sans } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// StunpreX visual identity — Blueprint v2.1 §7.
// Headings — Mate
const mate = Mate({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-mate',
  display: 'swap',
});

// Body — Play
const play = Play({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-play',
  display: 'swap',
});

// Menu / CTA / technical — Dosis
const dosis = Dosis({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dosis',
  display: 'swap',
});

// Forum / long-form — Noto Sans
const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.stunprex.com'),
  title: {
    default: 'StunpreX — Train Smarter. Play Better. Reach Your Full Potential.',
    template: '%s · StunpreX',
  },
  description:
    'Individual soccer player development — methodology-first. Articles, drills, and a community for players, parents, and coaches. Free.',
  keywords: [
    'soccer development',
    'football training',
    'individual player development',
    'youth soccer',
    'soccer drills',
    'StunpreX',
  ],
  applicationName: 'StunpreX',
  authors: [{ name: 'DField Kft.' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.stunprex.com',
    title: 'StunpreX — Train Smarter. Play Better. Reach Your Full Potential.',
    description:
      'A soccer player development hub for individual development. Methodology-first. Codex-driven.',
    siteName: 'StunpreX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StunpreX',
    description: 'Train Smarter. Play Better. Reach Your Full Potential.',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.stunprex.com',
    types: {
      'application/rss+xml': 'https://www.stunprex.com/feed.xml',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#107099',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${mate.variable} ${play.variable} ${dosis.variable} ${notoSans.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
