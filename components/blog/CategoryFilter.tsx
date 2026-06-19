'use client';
// CategoryFilter — category chips for /blog index and /blog/category/[slug].
// Uses router navigation; active state derived from current pathname.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category, CategorySlug } from '@/lib/types/post';
import { CATEGORY_SLUGS } from '@/lib/types/post';
import { filterChipClass } from '@/components/ui/filterChip';

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
        className={filterChipClass(isAll)}
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
            className={filterChipClass(isActive)}
            aria-current={isActive ? 'page' : undefined}
          >
            {cat}
          </Link>
        );
      })}
    </nav>
  );
}
