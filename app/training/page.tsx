import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Training' };

export default function Page() {
  return (
    <ComingSoon
      section="Training"
      blurb="A library of structured drills — themed, searchable, filterable. Filter by number of players, drill aim, age band, equipment, and the capacities each drill builds. Every drill traces to a principle, comes with a coaching note, and progresses across five levels."
      shipsIn="Coming soon"
    />
  );
}
