import Link from 'next/link';
import { PRIMARY_NAV } from '@/lib/nav';
import { Logo } from './Logo';
import { MobileNav } from './MobileNav';

export function Header() {
  return (
    <>
      {/* Skip to content — WCAG 2.4.1 Bypass Blocks. Visible only on keyboard focus. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-deepblue focus:px-4 focus:py-2 focus:font-ui focus:text-sm focus:text-mint focus:shadow-lg"
      >
        Skip to content
      </a>
      <header className="border-b border-deepblue/10 bg-mint sticky top-0 z-40 backdrop-blur-sm bg-mint/90">
      <div className="container-site flex items-center justify-between py-3">
        <Logo size={44} />

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Sign in — desktop only */}
          <Link
            href="/signin"
            className="hidden lg:inline font-ui text-sm text-brown/70 hover:text-deepblue transition-colors"
          >
            Sign in
          </Link>
          {/* Primary CTA — always visible */}
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">
            Start training
          </Link>
          {/* Mobile hamburger — hidden on desktop */}
          <MobileNav />
        </div>
      </div>
    </header>
    </>
  );
}
