import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Shop' };

export default function Page() {
  return (
    <ComingSoon
      section="Shop"
      blurb="The right tools for next-level training."
      shipsIn="Later this year"
    />
  );
}
