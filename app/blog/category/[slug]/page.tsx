// /blog/category/[slug] — Category-filtered blog index.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreadcrumbNav } from '@/components/blog/BreadcrumbNav';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { Pagination } from '@/components/blog/Pagination';
import { BlogIndexClient } from '../../BlogIndexClient';
import { getPostCardsByCategory, getPublishedCategories } from '@/lib/posts';
import { CATEGORY_LABELS } from '@/lib/types/post';
import type { CategorySlug } from '@/lib/types/post';

const POSTS_PER_PAGE = 12;

const ALL_CATEGORY_SLUGS: CategorySlug[] = [
  'methodology',
  'drills',
  'pro-breakdown',
  'operational-core',
  'reflections',
];

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const catSlug = slug as CategorySlug;
  const category = CATEGORY_LABELS[catSlug];
  if (!category) return {};

  return {
    title: `${category} — Blog`,
    description: `StunpreX blog posts in the ${category} category — methodology-first soccer player development.`,
    alternates: {
      canonical: `https://stunprex.com/blog/category/${catSlug}`,
    },
    openGraph: {
      title: `${category} · StunpreX Blog`,
      description: `Methodology-first soccer development posts in the ${category} category.`,
      type: 'website',
      url: `https://stunprex.com/blog/category/${catSlug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const catSlug = slug as CategorySlug;
  const category = CATEGORY_LABELS[catSlug];

  if (!category) notFound();

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10));
  const allCatPosts = getPostCardsByCategory(catSlug);
  const categories = getPublishedCategories();

  const totalPages = Math.max(1, Math.ceil(allCatPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagePosts = allCatPosts.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE);

  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {/* Page hero */}
        <section className="border-b border-deepblue/8 bg-deepblue/[0.02] py-14">
          <div className="container-site">
            <BreadcrumbNav
              crumbs={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: category },
              ]}
            />
            <h1 className="mb-3 text-deepblue font-heading">{category}</h1>
            <p className="max-w-2xl text-lg text-brown/70 font-body leading-relaxed">
              {CATEGORY_BLURBS[catSlug]}
            </p>
          </div>
        </section>

        {/* Filter + content */}
        <section className="py-12">
          <div className="container-site">
            {categories.length > 0 && (
              <div className="mb-8">
                <CategoryFilter categories={categories} />
              </div>
            )}

            {/* Post grid — search disabled on category pages (results ambiguous) */}
            <BlogIndexClient allPosts={pagePosts} showSearch={false} />

            {allCatPosts.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-brown/50 font-body">
                  No {category} posts published yet.{' '}
                  <a href="/blog" className="text-deepblue hover:text-orange underline">
                    Browse all posts
                  </a>
                  .
                </p>
              </div>
            )}

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              baseHref={`/blog/category/${catSlug}`}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const CATEGORY_BLURBS: Record<CategorySlug, string> = {
  methodology:
    'Deep dives into what StunpreX believes — the ideas behind how we develop players at every age.',
  drills:
    'Multi-capacity drills in full StunpreX format — tagged by capacity family, age band, and equipment.',
  'pro-breakdown':
    'Pro player and match analysis through the Capacities Framework — what the best players do and why it matters for your development.',
  'operational-core':
    'High-care topics: the Parent Compact, deselection, sleep, nutrition, goalkeeper development, and the long horizon.',
  reflections:
    'Founder-voice essays on methodology, the state of youth football, and what it means to take the long view.',
};
