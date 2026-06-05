/**
 * Site footer — wave-2 polish.
 * Audiences column removed (ComingSoon placeholders; re-added when real content ships).
 * Grid reduced from 5 to 4 columns. Brand copy and copyright simplified.
 */
import Image from 'next/image';
import Link from 'next/link';
import { PRIMARY_NAV } from '@/lib/nav';

const BRAND = [
  { href: '/methodology', label: 'Methodology' },
  { href: '/about',       label: 'About' },
  { href: '/signin',      label: 'Sign in' },
];

const LEGAL = [
  { href: '/privacy',  label: 'Privacy' },
  { href: '/terms',    label: 'Terms' },
  { href: '/cookies',  label: 'Cookies' },
  { href: '/imprint',  label: 'Imprint' },
];

export function Footer() {
  return (
    <footer className="bg-deepblue text-white/85 mt-12">
      <div className="container-site py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt=""
                width={56}
                height={56}
                className="rounded-full bg-white/95 p-1"
              />
              <div>
                <p className="font-heading text-3xl text-white">StunpreX</p>
                <p className="text-xs text-white/65 font-ui uppercase tracking-widest">
                  Strive · Unleash · Progress · Excel
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-white/75 leading-relaxed max-w-sm">
              A methodology-first hub for individual soccer player development. Built lean,
              refined continuously, defended in public.
            </p>
          </div>

          <div>
            <h4 className="font-ui uppercase tracking-widest text-sm text-orange mb-4">
              Sections
            </h4>
            <ul className="space-y-2 text-sm">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-orange text-white/85 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-ui uppercase tracking-widest text-sm text-orange mb-4">
              Brand
            </h4>
            <ul className="space-y-2 text-sm">
              {BRAND.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-orange text-white/85 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm">
          <p className="text-white/60">
            © {new Date().getFullYear()} DField Kft. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-6">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/65 hover:text-orange transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
