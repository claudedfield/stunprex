// /blog — Blog index page.
// Server-renders the full post list; client-side search overlay via BlogIndexClient.
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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

const POSTS_PER_PAGE = 10;

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
        {/* Page hero */}
        <section className="border-b border-deepblue/8 bg-deepblue/[0.02] py-14">
          <div className="container-site">
            <h1 className="mb-3 text-deepblue font-heading">
              Blog
            </h1>
            <p className="max-w-2xl text-lg text-brown/70 font-body leading-relaxed">
              Methodology-first articles on individual soccer player development.
              Grounded in the Codex. Written for players, parents, coaches, and the broader
              football development community.
            </p>
          </div>
        </section>

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
