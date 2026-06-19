import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { PatternBreak } from '@/components/games/PatternBreak';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern Break — Cognitive Games',
  description:
    'Read the repeating pattern, then catch the moment it changes — without over-calling. A signal-detection game that trains anticipation and inhibition. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('pattern-break')!;
  let isAuthed = false;
  try {
    const session = await auth();
    isAuthed = !!session?.user;
  } catch {
    isAuthed = false;
  }
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <GameShell
          game={game}
          isAuthed={isAuthed}
          howToPlay={
            <>
              <p>A short sequence of tiles repeats in a loop — learn the pattern as it runs.</p>
              <p>Most steps follow it, but sometimes a step breaks the pattern. Hit “Break!” the moment you spot the deviation.</p>
              <p>Don’t over-call: tapping when it actually followed is a false alarm. Catch the real breaks, ignore the rest.</p>
            </>
          }
          related={[
            { href: '/capacities/adaptive', label: 'Adaptive capacity' },
            { href: '/blog/cognitive-capacity', label: 'The cognitive capacity' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <PatternBreak />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
