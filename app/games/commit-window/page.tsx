import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { CommitWindow } from '@/components/games/CommitWindow';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'The Commit Window — Cognitive Games',
  description:
    'A defender approaches. A window opens briefly — tap inside it. Train the timing and impulse control that separates a committed dribble from a reckless lunge. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('commit-window')!;
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
              <p>
                A red defender approaches you on a horizontal track. A green window opens
                briefly as the defender gets close — tap anywhere on the track during that
                window to commit.
              </p>
              <p>
                Tap too early and the defender adjusts. Wait too long and the window closes.
                Some reps include an orange feint flash before the real window — hold back
                through it, then commit when green appears.
              </p>
              <p>
                Twelve reps per round. The approach gets faster as difficulty increases. Your
                score is the number of reps where you committed inside the window.
              </p>
            </>
          }
          related={[
            { href: '/capacities/cognitive', label: 'Cognitive capacity' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <CommitWindow />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
