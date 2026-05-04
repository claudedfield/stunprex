import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: 'horizontal' | 'mark-only';
  className?: string;
}

export function Logo({
  size = 44,
  showWordmark = true,
  variant = 'horizontal',
  className = '',
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="StunpreX home"
      className={`inline-flex items-center gap-3 group ${className}`}
    >
      <Image
        src="/brand/logo.png"
        alt="StunpreX"
        width={size}
        height={size}
        priority
        className="shrink-0"
      />
      {variant === 'horizontal' && showWordmark && (
        <span className="hidden sm:flex flex-col leading-tight">
          <span className="font-heading text-2xl font-bold text-deepblue group-hover:text-orange transition-colors">
            StunpreX
          </span>
          <span className="font-ui uppercase tracking-widest text-[9px] text-brown/55 hidden lg:inline">
            Strive · Unleash · Progress · Excel
          </span>
        </span>
      )}
    </Link>
  );
}
