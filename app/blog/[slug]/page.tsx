// /blog/[slug] — Post detail page.
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BreadcrumbNav } from '@/components/blog/BreadcrumbNav';
import { PostMeta } from '@/components/blog/PostMeta';
import { CodexAnchorBlock } from '@/components/blog/CodexAnchorBlock';
import { TableOfContents, extractHeadings } from '@/components/blog/TableOfContents';
import { ShareLinks } from '@/components/blog/ShareLinks';
import { mdxComponents } from '@/components/blog/MdxComponents';
import { getPostBySlug, getAllPostSlugs } from '@/lib/posts';
import { CATEGORY_SLUGS } from '@/lib/types/post';
import Link from 'next/link';

// Estimate word count from source
function wordCount(source: string): number {
  return source.trim().split(/\s+/).length;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const { frontmatter } = post;
  const canonicalUrl = frontmatter.canonical ?? `https://stunprex.com/blog/${slug}`;
  const ogImage = frontmatter.ogImage ?? '/og-image.jpg';

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    keywords: [frontmatter.keywords.primary, ...frontmatter.keywords.secondary],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: 'article',
      url: canonicalUrl,
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.lastModified ?? frontmatter.date,
      authors: ['https://stunprex.com/about'],
      tags: [frontmatter.keywords.primary, ...frontmatter.keywords.secondary],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { frontmatter, source, readingTime } = post;
  const catSlug = CATEGORY_SLUGS[frontmatter.category];
  const postUrl = `https://stunprex.com/blog/${slug}`;
  const hasLongContent = wordCount(source) >= 1200;
  const headings = hasLongContent ? extractHeadings(source) : [];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: frontmatter.title,
        description: frontmatter.description,
        datePublished: frontmatter.date,
        dateModified: frontmatter.lastModified ?? frontmatter.date,
        author: {
          '@type': 'Organization',
          name: 'StunpreX',
          url: 'https://stunprex.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'StunpreX',
          url: 'https://stunprex.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://stunprex.com/brand/logo.png',
          },
        },
        image: {
          '@type': 'ImageObject',
          url: frontmatter.ogImage
            ? `https://stunprex.com${frontmatter.ogImage}`
            : 'https://stunprex.com/og-image.jpg',
          width: 1200,
          height: 630,
        },
        url: postUrl,
        mainEntityOfPage: postUrl,
        keywords: [frontmatter.keywords.primary, ...frontmatter.keywords.secondary].join(', '),
        articleSection: frontmatter.category,
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stunprex.com' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://stunprex.com/blog' },
          { '@type': 'ListItem', position: 3, name: frontmatter.category, item: `https://stunprex.com/blog/category/${catSlug}` },
          { '@type': 'ListItem', position: 4, name: frontmatter.title, item: postUrl },
        ],
      },
    ],
  };

  return (
    <>
      <Header />
      <main id="main-content">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Post header */}
        <header className="border-b border-deepblue/8 bg-deepblue/[0.02] py-12">
          <div className="container-site max-w-[860px]">
            <BreadcrumbNav
              crumbs={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog' },
                { label: frontmatter.category, href: `/blog/category/${catSlug}` },
                { label: frontmatter.title },
              ]}
            />
            <div className="mb-4">
              <Link
                href={`/blog/category/${catSlug}`}
                className="inline-flex items-center rounded-full border border-orange/30 bg-orange/8 px-3 py-0.5 text-xs font-semibold text-orange-700 font-ui tracking-wide hover:bg-orange/15 transition-colors"
              >
                {frontmatter.category}
              </Link>
            </div>
            <h1 className="mb-5 font-heading text-deepblue">{frontmatter.title}</h1>
            <p className="mb-6 text-lg text-brown/70 font-body leading-relaxed max-w-2xl">
              {frontmatter.description}
            </p>
            <PostMeta
              date={frontmatter.date}
              readingTime={readingTime}
              audienceLayer={frontmatter.audienceLayer}
              audienceLayerSecondary={frontmatter.audienceLayerSecondary}
            />
          </div>
        </header>

        {/* Post body */}
        <div className="py-12">
          <div className="container-site">
            <div className="mx-auto max-w-[860px] lg:grid lg:max-w-none lg:grid-cols-[1fr_260px] lg:gap-12 xl:grid-cols-[1fr_280px]">
              {/* Main column */}
              <article>
                {/* Content column — max-width matches post header so edges align at all breakpoints */}
                <div className="max-w-[860px]">
                  {/* Codex anchor block */}
                  <CodexAnchorBlock anchors={frontmatter.codexAnchors} category={frontmatter.category} />

                  {/* MDX content */}
                  <div className="prose-stunprex">
                    <MDXRemote source={source} components={mdxComponents} />
                  </div>

                  {/* Share links */}
                  <div className="mt-12 border-t border-deepblue/10 pt-8">
                    <ShareLinks title={frontmatter.title} url={postUrl} />
                  </div>
                </div>
              </article>

              {/* Sidebar — TOC */}
              {hasLongContent && headings.length > 0 && (
                <aside className="hidden lg:block">
                  <div className="sticky top-24">
                    <TableOfContents headings={headings} />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
