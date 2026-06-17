import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { ShoulderCheck } from '@/components/games/ShoulderCheck';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shoulder Check — Cognitive Games',
  description:
    'Markers flash at the edges as the ball approaches. Then tell us what you saw. A scanning game that trains the habit of gathering information before you act. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('shoulder-check')!;
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
                Markers flash briefly at the left and right edges while the ball is on its
                way to you. Blue circles are teammates; red circles are opponents. You
                don&rsquo;t need to do anything during the scan — just look.
              </p>
              <p>
                When the ball arrives, a question appears about what you saw: how many of
                each type, or which side had more opponents. Tap your answer.
              </p>
              <p>
                Ten reps. Difficulty increases each rep — markers flash faster and more
                appear at once. Your score is the number of correct answers.
              </p>
            </>
          }
          related={[
            { href: '/capacities/perceptual', label: 'Perceptual capacity' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <ShoulderCheck />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
