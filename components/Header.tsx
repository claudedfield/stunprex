import Link from 'next/link';
import { PRIMARY_NAV, UTILITY_NAV } from '@/lib/nav';

export function Header() {
  return (
    <header className="border-b border-deepblue/10 bg-mint sticky top-0 z-40 backdrop-blur-sm bg-mint/90">
      {/* Utility row — Codex / Methodology / About / Pricing */}
      <div className="hidden md:block border-b border-deepblue/5">
        <div className="container-site flex items-center justify-end gap-6 py-2 text-xs">
          {UTILITY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-ui uppercase tracking-wider text-brown/70 hover:text-orange transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-deepblue/15" aria-hidden />
          <Link
            href="/login"
            className="font-ui uppercase tracking-wider text-deepblue hover:text-orange"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Primary row — eight sections */}
      <div className="container-site flex items-center justify-between py-4">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-heading text-3xl font-bold text-deepblue group-hover:text-orange transition-colors">
            StunpreX
          </span>
          <span className="hidden lg:inline text-xs font-ui uppercase tracking-widest text-brown/50">
            Strive · Unleash · Progress · Excel
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/signup" className="btn-primary text-sm py-2 px-5">
          Start training
        </Link>
      </div>
    </header>
  );
}
