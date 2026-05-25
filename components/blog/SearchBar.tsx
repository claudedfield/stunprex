'use client';
// SearchBar — debounced client-side search using FlexSearch.
// Loads the static search index from /blog/search-index.json on first interaction.
import { useEffect, useRef, useState, useCallback } from 'react';
import type { SearchIndexEntry } from '@/lib/posts';

interface SearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
}

interface Props {
  onResults: (results: SearchResult[] | null) => void;
}

export function SearchBar({ onResults }: Props) {
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indexRef = useRef<any>(null);
  const entriesRef = useRef<SearchIndexEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load FlexSearch + index lazily on first keystroke
  const ensureIndex = useCallback(async () => {
    if (initialized) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [flexsearch, res] = await Promise.all([
        import('flexsearch') as Promise<any>,
        fetch('/blog/search-index'),
      ]);
      const entries: SearchIndexEntry[] = await res.json();
      entriesRef.current = entries;

      const DocumentClass = flexsearch.Document ?? flexsearch.default?.Document;
      const idx = new DocumentClass({
        document: {
          id: 'slug',
          index: ['title', 'description', 'keywords', 'body'],
          store: ['slug', 'title', 'description', 'category'],
        },
        tokenize: 'forward',
      });

      for (const entry of entries) {
        idx.add(entry);
      }

      indexRef.current = idx;
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  const search = useCallback((q: string) => {
    if (!indexRef.current || !q.trim()) {
      onResults(null);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = indexRef.current.search(q, { enrich: true, limit: 20 });
    // FlexSearch Document returns per-field results; flatten + deduplicate
    const seen = new Set<string>();
    const results: SearchResult[] = [];
    for (const field of raw) {
      for (const id of (field?.result ?? []) as string[]) {
        if (!seen.has(id)) {
          seen.add(id);
          const entry = entriesRef.current.find((e) => e.slug === id);
          if (entry) {
            results.push({
              slug: entry.slug,
              title: entry.title,
              description: entry.description,
              category: entry.category,
            });
          }
        }
      }
    }
    onResults(results);
  }, [onResults]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setQuery(q);

      if (!q.trim()) {
        onResults(null);
        return;
      }

      await ensureIndex();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => search(q), 180);
    },
    [ensureIndex, search, onResults]
  );

  // Clear results when query is emptied
  useEffect(() => {
    if (!query) onResults(null);
  }, [query, onResults]);

  return (
    <div className="relative">
      <label htmlFor="blog-search" className="sr-only">
        Search posts
      </label>
      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brown/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          id="blog-search"
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search posts…"
          className="w-full rounded-lg border border-deepblue/20 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-brown placeholder:text-brown/35 focus:border-deepblue focus:outline-none focus:ring-2 focus:ring-deepblue/20 transition-colors font-body"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-brown/40 font-ui">
            …
          </span>
        )}
      </div>
    </div>
  );
}
