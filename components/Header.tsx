import Link from 'next/link';
import { PRIMARY_NAV } from '@/lib/nav';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="border-b border-deepblue/10 bg-mint sticky top-0 z-40 backdrop-blur-sm bg-mint/90">
      {/* Primary row */}
      <div className="container-site flex items-center justify-between py-3">
        <Logo size={44} />

        <nav className="hidden lg:flex items-center gap-6">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="hidden sm:inline font-ui text-sm text-brown/70 hover:text-deepblue transition-colors"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-5">
            Start training
          </Link>
        </div>
      </div>
    </header>
  );
}
