// /methodology: the derived methodology page (D-WEB-24, owner decision OT-007).
// The wording is the Writer's text of record, copied mechanically into
// content/pages/methodology.mdx by scripts/sync-methodology.mjs. Never edit it here:
// marks go to the text of record, then the sync runs again.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageHero } from '@/components/PageHero';
import { mdxComponents } from '@/components/blog/MdxComponents';

const CANONICAL = 'https://stunprex.com/methodology';

function methodologyPage() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'content', 'pages', 'methodology.mdx'), 'utf8');
  const { data, content } = matter(raw);
  return {
    title: String(data.title),
    metaTitle: String(data.metaTitle),
    description: String(data.description),
    source: content,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { metaTitle, description } = methodologyPage();
  return {
    title: metaTitle,
    description,
    alternates: { canonical: CANONICAL },
    openGraph: { title: metaTitle, description, url: CANONICAL, type: 'website' },
  };
}

export default function MethodologyPage() {
  const { title, source } = methodologyPage();
  return (
    <>
      <Header />
      <main id="main-content">
        <PageHero eyebrow="Methodology" title={title} />
        <section className="container-site py-12 md:py-16">
          <article className="prose-stunprex mx-auto max-w-[760px]">
            <MDXRemote source={source} components={mdxComponents} />
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}
