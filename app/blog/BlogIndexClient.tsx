'use client';
// BlogIndexClient — client wrapper for SearchBar + filtered post list.
// All post data comes from server; this component handles search results overlay only.
import { useState, useCallback } from 'react';
import { SearchBar } from '@/components/blog/SearchBar';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import type { PostCard } from '@/lib/types/post';

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
}

interface Props {
  allPosts: PostCard[];       // the full (possibly pre-filtered by category) list from server
  showSearch: boolean;
}

export function BlogIndexClient({ allPosts, showSearch }: Props) {
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const handleResults = useCallback((results: SearchResult[] | null) => {
    setSearchResults(results);
  }, []);

  // When searching, build PostCards from matching slugs
  const displayPosts: PostCard[] = searchResults !== null
    ? searchResults
        .map((r) => allPosts.find((p) => p.slug === r.slug))
        .filter(Boolean) as PostCard[]
    : allPosts;

  return (
    <>
      {showSearch && (
        <div className="mb-8">
          <SearchBar onResults={handleResults} />
        </div>
      )}

      {searchResults !== null && (
        <p className="mb-6 text-sm text-brown/55 font-ui">
          {displayPosts.length === 0
            ? 'No posts matched your search.'
            : `${displayPosts.length} post${displayPosts.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayPosts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>

      {displayPosts.length === 0 && searchResults === null && (
        <div className="py-16 text-center">
          <p className="text-brown/50 font-body">No posts published yet. Check back soon.</p>
        </div>
      )}
    </>
  );
}
