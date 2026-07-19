import { ComingSoon } from '@/components/ComingSoon';

export const metadata = {
  title: 'Codex',
  description: 'The StunpreX Codex — the methodology of individual football development.',
};

export default function Page() {
  return (
    <ComingSoon
      section="Codex"
      blurb="The Codex remains internal while we finish the current revision. What it teaches already shapes every drill and article here — see Methodology for the plain-language version."
      shipsIn="Later this year"
    />
  );
}
