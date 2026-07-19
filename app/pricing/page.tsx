import { ComingSoon } from '@/components/ComingSoon';

export const metadata = {
  title: 'Pricing',
  description: 'StunpreX pricing — coming soon. No paid tiers yet.',
};

export default function Page() {
  return (
    <ComingSoon
      section="Pricing"
      blurb="StunpreX is free to use while the training content and services take shape. Pricing isn't set — we're not going to lock in numbers against a product that's still growing."
      shipsIn="Later this year"
    />
  );
}
