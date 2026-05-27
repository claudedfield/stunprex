import { ComingSoon } from '@/components/ComingSoon';

export const metadata = {
  title: 'Codex',
  description: 'The StunpreX Codex — the methodology of individual football development.',
};

export default function Page() {
  return (
    <ComingSoon
      section="Codex"
      blurb="The Codex remains internal during the current revision cycle."
      shipsIn="Selected thoughts will continue to appear in blog content in the meantime."
    />
  );
}
