'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV } from '@/lib/nav';

/**
 * MobileNav — hamburger button + full-height slide-in panel for screens < lg.
 * Closes on: route change, Escape key, or CTA/link click.
 * Locks body scroll while open.
 * Server component Header imports this; it is the only client boundary in the header.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = useCallback(() => setOpen(false), []);

  // Close on route change
  useEffect(() => { close(); }, [pathname, close]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger / X button — visible only below lg */}
      <button
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden flex h-9 w-9 flex-col items-center justify-center space-y-[5px] rounded-md hover:bg-deepblue/8 transition-colors"
      >
        <span
          className={`block h-0.5 w-5 rounded-sm bg-deepblue transition-all duration-200 origin-center ${
            open ? 'translate-y-[7px] rotate-45' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded-sm bg-deepblue transition-opacity duration-200 ${
            open ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded-sm bg-deepblue transition-all duration-200 origin-center ${
            open ? '-translate-y-[7px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Full-height nav panel — sits below the 68px header */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Main navigation"
          className="fixed inset-x-0 top-[68px] bottom-0 z-50 bg-mint overflow-y-auto px-6 py-8 lg:hidden"
        >
          <ul className="mb-8">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href} className="border-b border-deepblue/8 last:border-b-0">
                <Link
                  href={item.href}
                  className="flex items-center px-2 py-4 font-ui text-lg text-deepblue hover:text-orange transition-colors"
                  onClick={close}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 pt-4 border-t border-deepblue/10">
            <Link
              href="/signin"
              className="block text-center py-3 font-ui text-base text-brown/70 hover:text-deepblue border border-deepblue/20 rounded-lg hover:border-deepblue/40 transition-colors"
              onClick={close}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary block text-center py-3 text-base"
              onClick={close}
            >
              Start training
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
