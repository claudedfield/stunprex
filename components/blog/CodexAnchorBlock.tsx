// CodexAnchorBlock — renders methodology metadata at the top of every post.
// Credibility signal + editorial discipline gate. Small, design-tasteful.
// Capacity chips now link to /capacities/[family] (Wave C cross-linking).
// convictionThemes (plain-language) renders when present; bare conviction numbers stay internal.
import Link from 'next/link';
import { CAPACITY_FAMILY_TO_SLUG } from '@/lib/codex/themes';
import type { CapacityFamily } from '@/lib/types/drill';
import type { CodexAnchors } from '@/lib/types/post';

interface Props {
  anchors: CodexAnchors;
  category: string;
}

function capacitySlug(name: string): string | null {
  return CAPACITY_FAMILY_TO_SLUG[name as CapacityFamily] ?? null;
}

export function CodexAnchorBlock({ anchors, category }: Props) {
  const { convictions, convictionThemes, capacities, playerOperatingPrinciple, antiPatternProtected } = anchors;

  return (
    <aside
      aria-label="Methodology metadata"
      className="mb-10 rounded-lg border border-deepblue/15 bg-deepblue/[0.03] px-5 py-4 text-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-deepblue/50 font-ui">
        Methodology
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {/* Conviction themes (public) or fallback generic chip */}
        <div>
          <dt className="text-xs text-brown/50 font-ui mb-0.5">Themes</dt>
          <dd className="flex flex-wrap gap-1">
            {convictionThemes && convictionThemes.length > 0 ? (
              convictionThemes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center rounded bg-deepblue/10 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui"
                >
                  {theme}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded bg-deepblue/10 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui">
                Methodology
              </span>
            )}
          </dd>
        </div>

        {/* Capacities — linked to /capacities/[family] */}
        <div>
          <dt className="text-xs text-brown/50 font-ui mb-0.5">Capacity</dt>
          <dd className="flex flex-wrap gap-1">
            {(() => {
              const primarySlug = capacitySlug(capacities.primary);
              const primaryCls = 'inline-flex items-center rounded bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange-700 font-ui hover:bg-orange/20 transition-colors';
              const primaryEl = primarySlug ? (
                <Link key={capacities.primary} href={`/capacities/${primarySlug}`} className={primaryCls}>
                  {capacities.primary}
                </Link>
              ) : (
                <span key={capacities.primary} className={primaryCls}>{capacities.primary}</span>
              );

              const secondaryCls = 'inline-flex items-center rounded bg-orange/5 px-2 py-0.5 text-xs font-semibold text-orange-700/70 font-ui hover:bg-orange/10 transition-colors';
              const secondaryEl = capacities.secondary ? (() => {
                const secSlug = capacitySlug(capacities.secondary!);
                return secSlug ? (
                  <Link key={capacities.secondary} href={`/capacities/${secSlug}`} className={secondaryCls}>
                    {capacities.secondary}
                  </Link>
                ) : (
                  <span key={capacities.secondary} className={secondaryCls}>{capacities.secondary}</span>
                );
              })() : null;

              return <>{primaryEl}{secondaryEl}</>;
            })()}
          </dd>
        </div>

        {/* Player operating principle */}
        {playerOperatingPrinciple && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-brown/50 font-ui mb-0.5">Player operating principle</dt>
            <dd className="italic text-brown/70">&ldquo;{playerOperatingPrinciple}&rdquo;</dd>
          </div>
        )}

        {/* Anti-pattern protected */}
        {antiPatternProtected && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-brown/50 font-ui mb-0.5">Protects against</dt>
            <dd className="text-brown/70">{antiPatternProtected}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
