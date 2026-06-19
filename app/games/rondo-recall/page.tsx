import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { RondoRecall } from '@/components/games/RondoRecall';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rondo Recall — Cognitive Games',
  description:
    'Players flash positions, then vanish — recall where they were. A spatial working-memory game that trains knowing the picture without a second glance. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('rondo-recall')!;
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
              <p>A handful of players light up on the grid, then vanish. Click the cells where they were.</p>
              <p>Get them all and the next round adds one more to hold in mind. Miss twice and the round ends.</p>
              <p>Your score is how deep your spatial memory held — no second glance allowed.</p>
            </>
          }
          related={[
            { href: '/capacities/perceptual', label: 'Perceptual capacity' },
            { href: '/blog/perceptual-capacity', label: 'Perceptual capacity essay' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <RondoRecall />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
