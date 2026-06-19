// /blog — Blog index page.
// Server-renders the full post list; client-side search overlay via BlogIndexClient.
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { Pagination } from '@/components/blog/Pagination';
import { BlogIndexClient } from './BlogIndexClient';
import { getAllPostCards, getPublishedCategories } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog — Soccer Player Development',
  description:
    'Methodology-first articles on soccer player development — drills, tactical breakdowns, Codex convictions, and the long-horizon approach to building complete players.',
  openGraph: {
    title: 'Blog — StunpreX Soccer Development',
    description:
      'Methodology-first articles on soccer player development. Convictions, drills, and the science behind developing complete players.',
    type: 'website',
    url: 'https://stunprex.com/blog',
  },
  alternates: {
    canonical: 'https://stunprex.com/blog',
    types: {
      'application/rss+xml': 'https://stunprex.com/blog/rss.xml',
    },
  },
};

const POSTS_PER_PAGE = 12;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10));
  const allPosts = getAllPostCards();
  const categories = getPublishedCategories();

  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagePosts = allPosts.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        <PageHero
          eyebrow="Blog"
          title="Blog"
          lede="Methodology-first articles on individual soccer player development. Grounded in the Codex. Written for players, parents, coaches, and the broader football development community."
        />

        {/* Filter + content */}
        <section className="py-12">
          <div className="container-site">
            {/* Category chips */}
            {categories.length > 0 && (
              <div className="mb-8">
                <CategoryFilter categories={categories} />
              </div>
            )}

            {/* Search + post grid (client island) */}
            <BlogIndexClient allPosts={pagePosts} showSearch />

            {/* Pagination (server, no JS needed) */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              baseHref="/blog"
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
