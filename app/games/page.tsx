import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Games' };

export default function Page() {
  return (
    <ComingSoon
      section="Games"
      blurb="Boost your Soccer IQ with fun & interactive games."
      shipsIn="Wave 3 (after Sequence Boards launch)"
    />
  );
}
