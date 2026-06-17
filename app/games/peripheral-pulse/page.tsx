import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameShell } from '@/components/games/GameShell';
import { PeripheralPulse } from '@/components/games/PeripheralPulse';
import { getGame } from '@/lib/games/registry';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Peripheral Pulse — Cognitive Games',
  description:
    'Eyes on the centre digit. Catch what flickers at the edge. A dual-task game that trains peripheral detection while holding central focus — the awareness that lets you sense the run you never turned to look at. Free to play; sign in to save your score.',
};

export default async function Page() {
  const game = getGame('peripheral-pulse')!;
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
                The centre zone shows a large digit that changes every few seconds. Your
                target digit is shown in the header. Tap the centre whenever the digit
                matches your target — and only then.
              </p>
              <p>
                While you hold that central focus, orange pulses appear briefly in the left
                or right zone. Tap that side to register each pulse before it fades.
              </p>
              <p>
                Your score combines peripheral accuracy with central accuracy — abandoning
                the centre digit task to chase pulses drags the combined score down. 60
                seconds, continuous difficulty ramp.
              </p>
            </>
          }
          related={[
            { href: '/capacities/perceptual', label: 'Perceptual capacity' },
            { href: '/games', label: 'More games' },
          ]}
        >
          <PeripheralPulse />
        </GameShell>
      </main>
      <Footer />
    </>
  );
}
