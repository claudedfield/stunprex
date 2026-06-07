'use client';

// DrillLibrary — client island for /training listing.
// Receives pre-fetched drill cards from the server component; handles filter state.
import { useState, useMemo } from 'react';
import { DrillCard } from './DrillCard';
import type { DrillCard as DrillCardType, CapacityFamily, AgeBandFilter } from '@/lib/types/drill';
import { ALL_CAPACITY_FAMILIES, AGE_BANDS } from '@/lib/types/drill';

interface Props {
  drills: DrillCardType[];
}

export function DrillLibrary({ drills }: Props) {
  const [activeCapacities, setActiveCapacities] = useState<Set<CapacityFamily>>(new Set());
  const [activeAgeBands, setActiveAgeBands] = useState<Set<AgeBandFilter>>(new Set());

  function toggleCapacity(cap: CapacityFamily) {
    setActiveCapacities((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  }

  function toggleAgeBand(band: AgeBandFilter) {
    setActiveAgeBands((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  }

  function clearFilters() {
    setActiveCapacities(new Set());
    setActiveAgeBands(new Set());
  }

  const hasActiveFilters = activeCapacities.size > 0 || activeAgeBands.size > 0;

  const filtered = useMemo(() => {
    return drills.filter((drill) => {
      const { codexAnchors, ageBand } = drill.frontmatter;
      const allCapacities = [
        ...codexAnchors.capacities.primary,
        ...codexAnchors.capacities.secondary,
      ];

      // Capacity filter: OR semantics — drill matches if ANY selected family is present
      const passesCapacity =
        activeCapacities.size === 0 ||
        [...activeCapacities].some((cap) => allCapacities.includes(cap));

      // Age band filter: OR semantics — substring match against any ageBand field
      const ageBandString = [
        ageBand.introducible,
        ageBand.central,
        ageBand.maintenance,
      ].join(' ');
      const passesAgeBand =
        activeAgeBands.size === 0 ||
        [...activeAgeBands].some((band) => ageBandString.includes(band));

      return passesCapacity && passesAgeBand;
    });
  }, [drills, activeCapacities, activeAgeBands]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-8 space-y-4">
        {/* Capacity family pills */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui">
            Capacity family
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by capacity family">
            {ALL_CAPACITY_FAMILIES.map((cap) => {
              const active = activeCapacities.has(cap);
              return (
                <button
                  key={cap}
                  onClick={() => toggleCapacity(cap)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold font-ui transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                    active
                      ? 'border-deepblue bg-deepblue text-white'
                      : 'border-deepblue/20 bg-white text-deepblue hover:border-deepblue/50'
                  }`}
                >
                  {cap}
                </button>
              );
            })}
          </div>
        </div>

        {/* Age band pills */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui">
            Age band
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by age band">
            {AGE_BANDS.map((band) => {
              const active = activeAgeBands.has(band);
              return (
                <button
                  key={band}
                  onClick={() => toggleAgeBand(band)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold font-ui transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                    active
                      ? 'border-orange bg-orange text-white'
                      : 'border-orange/20 bg-white text-brown hover:border-orange/50'
                  }`}
                >
                  {band}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-brown/60 underline hover:text-brown transition-colors font-ui"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Drill grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brown/60 font-body text-lg">
            No drills match the current filter. Try removing one.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((drill) => (
            <DrillCard key={drill.slug} drill={drill} />
          ))}
        </div>
      )}
    </div>
  );
}
