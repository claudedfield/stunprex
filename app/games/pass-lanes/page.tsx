import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { PassLanes } from '@/components/games/PassLanes';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pass Lanes — Cognitive Games',
  description:
    'Pick the best pass before the lane closes. A decision-under-pressure game that trains reading options fast. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('pass-lanes')!;
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
              <p>You’re on the ball at the bottom. Teammates wait up the pitch, each in a lane a defender is shutting.</p>
              <p>Before the clock runs out, tap the teammate whose lane is most open — the best pass available right now.</p>
              <p>Lanes close fast and the gap between options narrows as you go. Quick, correct reads score best.</p>
            </>
          }
          related={[
            { href: '/capacities/cognitive', label: 'Cognitive capacity' },
            { href: '/blog/how-to-dribble-in-tight-spaces', label: 'Deciding under pressure' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <PassLanes />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
