'use client';
// TrainingIndexClient — search + multi-select facets + client-side pagination for the
// drill library. Mirrors the /blog filter+search UX (chip filters, search box, count),
// adapted to multi-facet client-side filtering over the full static drill set (~91).
import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import type { DrillCard, CapacityFamily, AgeBand, DrillCategory } from '@/lib/types/drill';
import {
  CAPACITY_FAMILIES,
  AGE_BANDS,
  DRILL_CATEGORIES,
} from '@/lib/types/drill';
import { filterChipClass } from '@/components/ui/filterChip';

const PER_PAGE = 12;
const DIFFICULTIES = [1, 2, 3, 4, 5];

// ─── Drill card ────────────────────────────────────────────────────────────────

function DrillCardTile({ drill }: { drill: DrillCard }) {
  const { frontmatter, slug } = drill;
  const primaryCaps = frontmatter.capacities.primary.slice(0, 3);
  return (
    <Link
      href={`/training/${slug}`}
      className="group flex flex-col rounded-xl border border-deepblue/10 bg-white p-5 shadow-sm hover:border-deepblue/25 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-ui text-[10px] uppercase tracking-widest text-orange">
          {frontmatter.drillId}
        </span>
        <span className="flex gap-1">
          {Array.from({ length: frontmatter.maxDifficulty ?? 5 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                i < frontmatter.difficulty ? 'bg-orange' : 'bg-deepblue/15'
              }`}
            />
          ))}
        </span>
      </div>
      <h2 className="font-heading text-deepblue text-lg leading-snug mb-2 group-hover:text-deepblue/80 transition-colors">
        {frontmatter.title}
      </h2>
      {frontmatter.category && (
        <span className="mb-2 inline-block w-fit rounded-full bg-orange/10 px-2.5 py-0.5 font-ui text-[10px] uppercase tracking-wide text-orange-700">
          {frontmatter.category}
        </span>
      )}
      <p className="font-body text-sm text-brown/70 leading-relaxed flex-1 mb-4">
        {frontmatter.description}
      </p>
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {primaryCaps.map((cap) => (
            <span
              key={cap}
              className="inline-block rounded-full bg-deepblue/8 px-2.5 py-0.5 font-ui text-[10px] text-deepblue"
            >
              {cap}
            </span>
          ))}
        </div>
        <span className="font-ui text-[10px] text-brown/40 whitespace-nowrap">
          {frontmatter.players} · {frontmatter.ageBand[0]}+
        </span>
      </div>
    </Link>
  );
}

// ─── Facet chip group ────────────────────────────────────────────────────────────

function FacetGroup<T extends string | number>({
  label,
  options,
  selected,
  onToggle,
  format,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div>
      <p className="mb-2.5 font-ui text-[11px] uppercase tracking-widest text-brown/45">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt);
          return (
            <button
              key={String(opt)}
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggle(opt)}
              className={filterChipClass(isActive)}
            >
              {format ? format(opt) : String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────

export function TrainingIndexClient({ drills }: { drills: DrillCard[] }) {
  const [query, setQuery] = useState('');
  const [caps, setCaps] = useState<CapacityFamily[]>([]);
  const [ages, setAges] = useState<AgeBand[]>([]);
  const [diffs, setDiffs] = useState<number[]>([]);
  const [cats, setCats] = useState<DrillCategory[]>([]);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile disclosure

  const makeToggle = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
      (v: T) => {
        setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
        setPage(1);
      },
    [],
  );

  const toggleCap = useMemo(() => makeToggle(setCaps), [makeToggle]);
  const toggleAge = useMemo(() => makeToggle(setAges), [makeToggle]);
  const toggleDiff = useMemo(() => makeToggle(setDiffs), [makeToggle]);
  const toggleCat = useMemo(() => makeToggle(setCats), [makeToggle]);

  const activeCount = caps.length + ages.length + diffs.length + cats.length + (query.trim() ? 1 : 0);

  const clearAll = useCallback(() => {
    setQuery('');
    setCaps([]);
    setAges([]);
    setDiffs([]);
    setCats([]);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drills.filter((d) => {
      const fm = d.frontmatter;
      if (q && !`${fm.title} ${fm.description}`.toLowerCase().includes(q)) return false;
      if (caps.length) {
        const all = [...fm.capacities.primary, ...(fm.capacities.secondary ?? [])];
        if (!caps.some((c) => all.includes(c))) return false;
      }
      if (ages.length && !ages.some((a) => fm.ageBand.includes(a))) return false;
      if (diffs.length && !diffs.includes(fm.difficulty)) return false;
      if (cats.length && (!fm.category || !cats.includes(fm.category))) return false;
      return true;
    });
  }, [drills, query, caps, ages, diffs, cats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div>
      {/* Mobile filter toggle */}
      <button
        type="button"
        onClick={() => setFiltersOpen((o) => !o)}
        aria-expanded={filtersOpen}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-deepblue/20 px-4 py-2 font-ui text-sm text-deepblue sm:hidden"
      >
        {filtersOpen ? 'Hide filters' : 'Filters'}
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-[11px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Facets — open chip rows, unified with /blog */}
      <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block mb-8 space-y-5`}>
        <FacetGroup label="Capacity family" options={CAPACITY_FAMILIES} selected={caps} onToggle={toggleCap} />
        <FacetGroup label="Age band" options={AGE_BANDS} selected={ages} onToggle={toggleAge} />
        <FacetGroup label="Difficulty" options={DIFFICULTIES} selected={diffs} onToggle={toggleDiff} format={(d) => `Level ${d}`} />
        <FacetGroup label="Theme" options={DRILL_CATEGORIES} selected={cats} onToggle={toggleCat} />
      </div>

      {/* Search — same component style as /blog */}
      <div className="relative mb-8">
        <label htmlFor="drill-search" className="sr-only">Search drills</label>
        <svg
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brown/40"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          id="drill-search"
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search drills…"
          className="w-full rounded-lg border border-deepblue/20 bg-white/60 py-2.5 pl-10 pr-4 text-sm text-brown placeholder:text-brown/35 focus:border-deepblue focus:outline-none focus:ring-2 focus:ring-deepblue/20 transition-colors font-body"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Count + clear */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-brown/70 font-ui">
          {filtered.length} drill{filtered.length !== 1 ? 's' : ''}
          {activeCount > 0 ? ' found' : ''}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="font-ui text-sm text-deepblue underline underline-offset-2 hover:text-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:rounded"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results */}
      {pageItems.length === 0 ? (
        <div className="rounded-xl border border-deepblue/10 bg-white py-16 text-center">
          <p className="font-body text-brown/70">No drills match these filters.</p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 font-ui text-sm text-deepblue underline underline-offset-2 hover:text-orange"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((drill) => (
            <DrillCardTile key={drill.slug} drill={drill} />
          ))}
        </div>
      )}

      {/* Pagination (client) */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-deepblue/20 text-deepblue transition-colors hover:bg-deepblue hover:text-white disabled:cursor-not-allowed disabled:border-brown/10 disabled:text-brown/25 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === safePage ? 'page' : undefined}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1 ${
                p === safePage
                  ? 'border border-deepblue bg-deepblue text-white'
                  : 'border border-deepblue/20 text-deepblue hover:bg-deepblue/8'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-deepblue/20 text-deepblue transition-colors hover:bg-deepblue hover:text-white disabled:cursor-not-allowed disabled:border-brown/10 disabled:text-brown/25 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepblue/40 focus-visible:ring-offset-1"
          >
            →
          </button>
        </nav>
      )}
    </div>
  );
}
