import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { HoldYourNerve } from '@/components/games/HoldYourNerve';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hold Your Nerve — Cognitive Games',
  description:
    'A gentle precision task while the atmosphere builds — never punitive. Trains focus and composure under rising pressure. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('hold-your-nerve')!;
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
              <p>A target appears and a ring closes toward its centre. Tap as close to the bullseye as you can, as the ring reaches the sweet spot.</p>
              <p>The atmosphere builds as you go — that’s the point. There’s no failing here; every tap scores its own precision.</p>
              <p>Feeling it? Hit “Calm it down” any time. Composure is the rep, not a verdict.</p>
            </>
          }
          related={[
            { href: '/capacities/affective', label: 'Affective capacity' },
            { href: '/blog/xhaka-communication-composure', label: 'Composure under pressure' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <HoldYourNerve />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
