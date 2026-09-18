import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: { absolute: 'MyStunpreX' } };

export default function Page() {
  return (
    <ComingSoon
      section="MyStunpreX"
      blurb="Your journey, your progress, your success."
      shipsIn="Soon"
    />
  );
}
