import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Training' };

export default function Page() {
  return (
    <ComingSoon
      section="Training"
      blurb="Train smarter, play better."
      shipsIn="Block 2 (Weeks 3–4 of Wave 2)"
    />
  );
}
