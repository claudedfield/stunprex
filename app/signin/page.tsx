import { ComingSoon } from '@/components/ComingSoon';

export const metadata = { title: 'Sign in' };

export default function Page() {
  return (
    <ComingSoon
      section="Sign in"
      blurb="Sign-in is coming with the community launch — currently in development."
      shipsIn="Next deploy"
    />
  );
}
