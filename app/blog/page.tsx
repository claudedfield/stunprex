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
    url: 'https://www.stunprex.com/blog',
    siteName: 'StunpreX',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — StunpreX Soccer Development',
    description:
      'Methodology-first articles on soccer player development. Convictions, drills, and the science behind developing complete players.',
  },
  alternates: {
    canonical: 'https://www.stunprex.com/blog',
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
        {/* Page hero — matches the site-wide hero pattern (Training / About / Community / Games) */}
        <section className="container-site py-24 md:py-32">
          <p className="font-ui uppercase tracking-widest text-sm text-orange mb-3">
            Blog
          </p>
          <h1 className="font-heading mt-3">Blog</h1>
          <p className="mt-6 text-brown/85 text-lg leading-relaxed max-w-3xl">
            Methodology-first articles on individual soccer player development. Written for
            players, parents, coaches, and the broader football development community.
          </p>
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
