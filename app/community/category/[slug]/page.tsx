/**
 * /community/category/[slug] — Category filter page.
 * Delegates to the main community index with category pre-set.
 * Canonical approach: redirect to /?category=[slug] to avoid duplicate content.
 */
import { redirect } from 'next/navigation'
import { ALL_CATEGORIES } from '@/lib/types/community'
import type { PostCategory } from '@/lib/types/community'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Validate category and redirect to main index with filter
  if (ALL_CATEGORIES.includes(slug as PostCategory)) {
    redirect(`/community?category=${slug}`)
  }

  // Unknown category — redirect to index
  redirect('/community')
}
