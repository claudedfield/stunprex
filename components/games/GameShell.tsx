import type { ReactNode } from 'react';
import Link from 'next/link';
import { HONEST_TRANSFER_NOTE, type GameMeta } from '@/lib/games/registry';
import { GamesAuthProvider } from './gamesAuth';

/**
 * GameShell — the unified wrapper every cognitive game renders inside.
 * The games analogue of PageHero: build the brand + the honesty frame once,
 * every game inherits it. Presentational; the game itself is passed as children.
 */
export interface GameShellProps {
  game: GameMeta;
  /** 2–3 short lines on how to play. */
  howToPlay: ReactNode;
  /** The playable game (a client component). */
  children: ReactNode;
  /** Optional related links (capacity page, drill, article). */
  related?: { href: string; label: string }[];
  /** Whether the visitor has a free account. Play is always open; saving is gated. */
  isAuthed?: boolean;
}

function CapacityChip({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-deepblue/8 px-2.5 py-0.5 font-ui text-[11px] uppercase tracking-ui text-deepblue">
      {label}
    </span>
  );
}

export function GameShell({
  game,
  howToPlay,
  children,
  related,
  isAuthed = false,
}: GameShellProps) {
  return (
    <article className="container-site py-10 md:py-14">
      <Link
        href="/games"
        className="font-ui text-sm text-deepblue/70 hover:text-orange"
      >
        ← All games
      </Link>

      <header className="mt-4 max-w-2xl">
        <div className="mb-3 flex flex-wrap gap-2">
          {game.capacities.map((c) => (
            <CapacityChip key={c} label={c} />
          ))}
        </div>
        <h1 className="font-heading text-deepblue">{game.name}</h1>
        <p className="mt-3 text-lg text-brown/80 font-body leading-relaxed">
          {game.tagline}
        </p>
      </header>

      {/* What this trains + the honest transfer frame (required on every game). */}
      <section className="mt-6 max-w-2xl rounded-lg border border-deepblue/10 bg-deepblue/[0.02] p-5">
        <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">
          What this trains
        </p>
        <p className="text-brown/85 font-body leading-relaxed">{game.trains}</p>
        <p className="mt-3 text-sm text-brown/60 font-body italic leading-relaxed">
          {HONEST_TRANSFER_NOTE}
        </p>
      </section>

      {/* How to play. */}
      <section className="mt-6 max-w-2xl">
        <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">
          How to play
        </p>
        <div className="text-brown/80 font-body leading-relaxed space-y-1">
          {howToPlay}
        </div>
      </section>

      {/* The game. Always playable; the provider tells it whether saving is unlocked. */}
      <section className="mt-8">
        <GamesAuthProvider isAuthed={isAuthed}>{children}</GamesAuthProvider>
      </section>

      {related && related.length > 0 ? (
        <footer className="mt-10 max-w-2xl border-t border-deepblue/10 pt-6">
          <p className="font-ui text-xs uppercase tracking-widest text-orange mb-3">
            Go deeper
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="font-ui text-sm text-deepblue hover:text-orange"
                >
                  {r.label} →
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}
