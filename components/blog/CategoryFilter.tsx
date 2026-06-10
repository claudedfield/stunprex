'use client';
// CategoryFilter — category chips for /blog index and /blog/category/[slug].
// Uses router navigation; active state derived from current pathname.
import { usePathname } from 'next/navigation';
import { Chip } from '@/components/Chip';
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
      <Chip href="/blog" active={isAll} aria-current={isAll ? 'page' : undefined}>
        All
      </Chip>
      {categories.map((cat) => {
        const slug = CATEGORY_SLUGS[cat];
        const isActive = activeSlug === slug;
        return (
          <Chip
            key={slug}
            href={`/blog/category/${slug}`}
            active={isActive}
            aria-current={isActive ? 'page' : undefined}
          >
            {cat}
          </Chip>
        );
      })}
    </nav>
  );
}
