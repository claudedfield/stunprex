// BlogPostCard — preview tile for list views.
import Link from 'next/link';
import { PostMeta } from './PostMeta';
import type { PostCard } from '@/lib/types/post';
import { CATEGORY_SLUGS } from '@/lib/types/post';

interface Props {
  post: PostCard;
}

export function BlogPostCard({ post }: Props) {
  const { frontmatter, slug, readingTime } = post;
  const catSlug = CATEGORY_SLUGS[frontmatter.category as keyof typeof CATEGORY_SLUGS];

  return (
    <article className="group flex flex-col rounded-xl border border-deepblue/10 bg-white/70 p-6 transition-shadow hover:shadow-md hover:shadow-deepblue/8">
      {/* Category chip */}
      <Link
        href={`/blog/category/${catSlug}`}
        className="mb-3 self-start inline-flex items-center rounded-full border border-orange/30 bg-orange/8 px-3 py-0.5 text-xs font-semibold text-orange-700 font-ui tracking-wide hover:bg-orange/15 transition-colors"
        tabIndex={-1}
        aria-label={`Category: ${frontmatter.category}`}
      >
        {frontmatter.category}
      </Link>

      {/* Title */}
      <h2 className="mb-2 text-xl leading-snug text-deepblue font-heading group-hover:text-orange transition-colors">
        <Link
          href={`/blog/${slug}`}
          className="hover:text-orange focus:outline-none focus-visible:underline"
        >
          {frontmatter.title}
        </Link>
      </h2>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-brown/70 font-body line-clamp-3">
        {frontmatter.description}
      </p>

      {/* Meta */}
      <PostMeta
        date={frontmatter.date}
        readingTime={readingTime}
        audienceLayer={frontmatter.audienceLayer}
        audienceLayerSecondary={frontmatter.audienceLayerSecondary}
      />
    </article>
  );
}
