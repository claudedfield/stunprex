// CodexAnchorBlock — renders Codex-anchor metadata at the top of every post.
// Credibility signal + operational discipline gate. Small, design-tasteful.
import type { CodexAnchors } from '@/lib/types/post';

interface Props {
  anchors: CodexAnchors;
  category: string;
}

export function CodexAnchorBlock({ anchors, category }: Props) {
  const { convictions, capacities, playerOperatingPrinciple, antiPatternProtected } = anchors;

  return (
    <aside
      aria-label="Codex anchor metadata"
      className="mb-10 rounded-lg border border-deepblue/15 bg-deepblue/[0.03] px-5 py-4 text-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-deepblue/50 font-ui">
        Codex anchor
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        {/* Convictions */}
        <div>
          <dt className="text-xs text-brown/50 font-ui mb-0.5">Conviction{convictions.length !== 1 ? 's' : ''}</dt>
          <dd className="flex flex-wrap gap-1">
            {convictions.map((n) => (
              <span
                key={n}
                className="inline-flex items-center rounded bg-deepblue/8 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui"
              >
                #{n}
              </span>
            ))}
          </dd>
        </div>

        {/* Capacities */}
        <div>
          <dt className="text-xs text-brown/50 font-ui mb-0.5">Capacity</dt>
          <dd className="flex flex-wrap gap-1">
            <span className="inline-flex items-center rounded bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange-700 font-ui">
              {capacities.primary}
            </span>
            {capacities.secondary && (
              <span className="inline-flex items-center rounded bg-orange/5 px-2 py-0.5 text-xs font-semibold text-orange-700/70 font-ui">
                {capacities.secondary}
              </span>
            )}
          </dd>
        </div>

        {/* Player operating principle */}
        {playerOperatingPrinciple && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-brown/50 font-ui mb-0.5">Player operating principle</dt>
            <dd className="italic text-brown/70">"{playerOperatingPrinciple}"</dd>
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
