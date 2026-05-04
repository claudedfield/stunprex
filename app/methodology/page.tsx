import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Methodology' };

export default function Page() {
  return (
    <ComingSoon
      section="Methodology"
      blurb="A plain-language entry to the Codex."
      shipsIn="Block 1 (Weeks 1–2 of Wave 2)"
    />
  );
}
