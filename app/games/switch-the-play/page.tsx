import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { SwitchThePlay } from '@/components/games/SwitchThePlay';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Switch the Play — Cognitive Games',
  description:
    'The rule just changed — route by colour, now by direction. A task-switching game that trains cognitive flexibility and shows your switch-cost. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('switch-the-play')!;
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
              <p>A token shows a colour and an arrow. The banner tells you which to follow — match the colour, or follow the arrow.</p>
              <p>The rule switches without much warning. Adapt to the new rule the instant it changes.</p>
              <p>We measure your accuracy and your switch-cost — the split-second lag right after the rule flips.</p>
            </>
          }
          related={[
            { href: '/capacities/adaptive', label: 'Adaptive capacity' },
            { href: '/blog/creative-dribbling-drills', label: 'Constraints & adaptation' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <SwitchThePlay />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
