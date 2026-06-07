/**
 * Site header — single primary row only (D8 alignment).
 *
 * Utility row (Codex / Methodology / Pricing / About) removed — Codex is internal,
 * Pricing is out of Q1, About now lives in PRIMARY_NAV.
 *
 * Mobile hamburger is deferred to feat/mobile-menu-v1 brief.
 * Current behaviour: mobile shows Logo + CTA only (existing pattern preserved).
 */
import Link from 'next/link';
import { PRIMARY_NAV } from '@/lib/nav';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="border-b border-deepblue/10 bg-mint sticky top-0 z-40 backdrop-blur-sm bg-mint/90">
      {/* Primary row — Logo | Nav (desktop) | Sign in | CTA */}
      <div className="container-site flex items-center justify-between py-3">
        <Logo size={44} />

        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/sign-in"
            className="hidden sm:inline font-ui uppercase text-deepblue hover:text-orange tracking-wider text-sm transition-colors"
          >
            Sign in
          </Link>
          <Link href="/community" className="btn-primary text-sm py-2 px-5">
            Join the community
          </Link>
        </div>
      </div>
      {/* Mobile menu deferred to mobile_menu_v1 brief */}
    </header>
  );
}
