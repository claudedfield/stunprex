import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Training' };

export default function Page() {
  return (
    <ComingSoon
      section="Training"
      blurb="Drill library, themed and filterable."
      shipsIn="Next implementation phase"
    />
  );
}
