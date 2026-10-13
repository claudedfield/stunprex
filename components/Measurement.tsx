'use client';

// D-WEB-31: one message to our own counter per page view. No cookie, nothing stored on the
// device, no other host. The path is sent without its query string; the server reduces it further
// (lib/metrics/core.ts). The referring site is sent once, on the first page of a visit.
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { sendMetric } from '@/lib/analytics/events';

export function Measurement() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    sendMetric({ t: 'pageview', p: pathname, r: first.current ? document.referrer || undefined : undefined });
    first.current = false;
  }, [pathname]);

  return null;
}
