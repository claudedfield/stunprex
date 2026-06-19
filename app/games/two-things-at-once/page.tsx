import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { TwoThingsAtOnce } from '@/components/games/TwoThingsAtOnce';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Two Things at Once — Cognitive Games',
  description:
    'Keep the ball under your finger while you answer the call. A divided-attention game that shows you the cost of doing two things at once. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('two-things-at-once')!;
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
              <p>First, just keep your pointer on the moving ball — that’s your baseline.</p>
              <p>Then a second job starts: chips flash up top. Tap “Now!” when the chip is orange and ignore the rest — while still tracking the ball.</p>
              <p>We show how much your tracking dips once the second task begins. That dip is the cost of doing two things at once.</p>
            </>
          }
          related={[
            { href: '/capacities/cognitive', label: 'Cognitive capacity' },
            { href: '/blog/scanning-while-dribbling', label: 'Dribbling while you scan' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <TwoThingsAtOnce />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
