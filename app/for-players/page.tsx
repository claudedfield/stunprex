import { ComingSoon } from '@/components/ComingSoon';
export const metadata = { title: 'For Players' };
export default function Page() {
  return (
    <ComingSoon
      section="For players"
      blurb="A dedicated path for players in development. Coming soon — for now, browse the blog and the community."
      shipsIn="Next phase"
    />
  );
}
