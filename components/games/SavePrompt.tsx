'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useGamesAuth } from './gamesAuth';
import { trackGameCompleted } from '@/lib/analytics/events';

/**
 * The capture moment — shown on a game's round-over screen, after the player
 * has felt the value. Authed: confirm the score is saved. Unauthed: a calm,
 * non-blocking invitation to a free account. Never a wall: play is always open.
 *
 * Every game renders this component exactly once per completed round, which
 * makes it the single shared hook point for the `game_completed` event —
 * fired here instead of duplicated across all ten game components.
 */
export function SavePrompt({ isBest, game }: { isBest: boolean; game: string }) {
  const { isAuthed } = useGamesAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackGameCompleted(game);
  }, [game]);

  if (isAuthed) {
    return (
      <p className="mt-3 text-sm text-deepblue">
        {isBest ? 'New personal best — saved to your profile.' : 'Saved to your profile.'}
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-deepblue/12 bg-deepblue/[0.03] p-4">
      <p className="text-sm text-brown/80 font-body">
        Want to keep your score and track progress over time? Create a free account —
        it takes a minute and the free tier stays genuinely usable.
      </p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <Link href="/signin" className="btn-primary">
          Register free
        </Link>
        <Link href="/signin" className="font-ui text-sm text-deepblue hover:text-orange">
          Sign in
        </Link>
      </div>
    </div>
  );
}
