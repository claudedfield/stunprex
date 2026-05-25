'use client';
// CategoryFilter — category chips for /blog index and /blog/category/[slug].
// Uses router navigation; active state derived from current pathname.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category, CategorySlug } from '@/lib/types/post';
import { CATEGORY_SLUGS } from '@/lib/types/post';

interface Props {
  categories: Category[];
}

export function CategoryFilter({ categories }: Props) {
  const pathname = usePathname();

  const isAll = !pathname.startsWith('/blog/category/');
  const activeSlug = isAll
    ? null
    : (pathname.split('/blog/category/')[1]?.split('/')[0] as CategorySlug | undefined);

  return (
    <nav aria-label="Filter posts by category" className="flex flex-wrap gap-2">
      {/* All */}
      <Link
        href="/blog"
        className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold font-ui tracking-wide transition-colors ${
          isAll
            ? 'border-deepblue bg-deepblue text-white'
            : 'border-deepblue/25 text-brown/70 hover:border-deepblue hover:text-deepblue'
        }`}
        aria-current={isAll ? 'page' : undefined}
      >
        All
      </Link>

      {categories.map((cat) => {
        const slug = CATEGORY_SLUGS[cat];
        const isActive = activeSlug === slug;
        return (
          <Link
            key={slug}
            href={`/blog/category/${slug}`}
            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold font-ui tracking-wide transition-colors ${
              isActive
                ? 'border-orange bg-orange text-white'
                : 'border-brown/20 text-brown/70 hover:border-orange hover:text-orange'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {cat}
          </Link>
        );
      })}
    </nav>
  );
}
