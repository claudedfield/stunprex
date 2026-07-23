'use client';
/**
 * Fires `drill_read_complete` only when BOTH are true: the visitor has
 * scrolled past the drill body (an invisible sentinel just after it enters
 * the viewport) AND stayed on the page past a dwell floor. Either alone is
 * not a read — a fast scroll to the bottom doesn't count, and neither does
 * a long-idle tab that never scrolled.
 */
import { useEffect, useRef } from 'react';
import { trackDrillReadComplete } from '@/lib/analytics/events';

const DWELL_FLOOR_MS = 20_000;

export function DrillReadTracker({ drillId }: { drillId: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const scrolledPastRef = useRef(false);
  const dwellMetRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    scrolledPastRef.current = false;
    dwellMetRef.current = false;

    function maybeFire() {
      if (firedRef.current) return;
      if (scrolledPastRef.current && dwellMetRef.current) {
        firedRef.current = true;
        trackDrillReadComplete(drillId);
      }
    }

    const dwellTimer = setTimeout(() => {
      dwellMetRef.current = true;
      maybeFire();
    }, DWELL_FLOOR_MS);

    const sentinel = sentinelRef.current;
    let observer: IntersectionObserver | undefined;
    if (sentinel) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            scrolledPastRef.current = true;
            maybeFire();
          }
        },
        { threshold: 0 },
      );
      observer.observe(sentinel);
    }

    return () => {
      clearTimeout(dwellTimer);
      observer?.disconnect();
    };
  }, [drillId]);

  return <div ref={sentinelRef} aria-hidden="true" className="h-px" />;
}
