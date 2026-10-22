/** /review/posts/[slug] (staging only): a draft article rendered as it would read, with the review bar. */
import type { Metadata } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { mdxComponents } from '@/components/blog/MdxComponents'
import { ReviewBar } from '@/components/review/ReviewBar'
import { reviewOpen } from '@/lib/review'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ReviewPostPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!reviewOpen()) notFound()
  const { slug } = await params
  if (!/^[a-z0-9-]+$/.test(slug)) notFound()
  const file = path.join(process.cwd(), 'content', 'posts', `${slug}.mdx`)
  if (!fs.existsSync(file)) notFound()
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  if (data.status !== 'draft') notFound()
  return (
    <>
      <Header />
      <main id="main-content" className="container-site min-h-[60vh] py-12 pb-64">
        <p className="font-ui text-xs uppercase tracking-widest text-orange mb-2">Not yet published</p>
        <h1 className="font-heading text-deepblue text-3xl md:text-4xl mb-4">{String(data.title ?? slug)}</h1>
        {data.description ? <p className="font-body text-lg text-brown/70 mb-8 max-w-2xl">{String(data.description)}</p> : null}
        <article className="prose-stunprex max-w-2xl">
          <MDXRemote source={content} components={mdxComponents} />
        </article>
      </main>
      <ReviewBar />
      <Footer />
    </>
  )
}
