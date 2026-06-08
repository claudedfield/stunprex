// DrillAnchorBlock — methodology metadata sidebar for drill detail pages.
// Parallels blog CodexAnchorBlock; adapted for drill-specific schema.
import type { DrillCodexAnchors } from '@/lib/types/drill';

interface Props {
  anchors: DrillCodexAnchors;
}

export function DrillAnchorBlock({ anchors }: Props) {
  const { convictionThemes, capacities, playerOperatingPrinciple } = anchors;

  return (
    <aside
      aria-label="Methodology"
      className="rounded-lg border border-deepblue/15 bg-deepblue/[0.03] px-5 py-4 text-sm"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-deepblue/50 font-ui">
        Methodology
      </p>
      <dl className="grid gap-3">
        {/* Conviction themes */}
        {convictionThemes.length > 0 && (
          <div>
            <dt className="text-xs text-brown/50 font-ui mb-1">Themes</dt>
            <dd className="flex flex-wrap gap-1">
              {convictionThemes.map((theme) => (
                <span
                  key={theme}
                  className="inline-flex items-center rounded bg-deepblue/10 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui"
                >
                  {theme}
                </span>
              ))}
            </dd>
          </div>
        )}

        {/* Player operating principle */}
        {playerOperatingPrinciple && (
          <div>
            <dt className="text-xs text-brown/50 font-ui mb-0.5">Player operating principle</dt>
            <dd className="italic text-brown/70">&ldquo;{playerOperatingPrinciple}&rdquo;</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
