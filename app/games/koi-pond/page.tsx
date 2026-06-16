import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { KoiPond } from '@/components/games/KoiPond';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Koi Pond — Cognitive Games',
  description:
    'Feed every fish once while the pond moves. A tracking-and-memory game that trains selective attention. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('koi-pond')!;
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
              <p>Feed every fish once by tapping or clicking it. Nothing marks who needs feeding — that’s the point.</p>
              <p>After each feed a feed timer counts down; you can’t feed again until it’s full. Use the wait to keep track of who you’ve fed (their colour helps).</p>
              <p>Don’t feed the same fish twice — re-feeding is the mistake. Clear the whole pond and it grows by a fish.</p>
            </>
          }
          related={[
            { href: '/capacities/perceptual', label: 'Perceptual capacity' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <KoiPond />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
