// DrillCard — listing tile for the /training page.
import Link from 'next/link';
import { DifficultyDots } from './DifficultyDots';
import { CapacityChips } from './CapacityChips';
import type { DrillCard as DrillCardType } from '@/lib/types/drill';

interface Props {
  drill: DrillCardType;
}

export function DrillCard({ drill }: Props) {
  const { frontmatter, slug } = drill;
  const { codexAnchors, ageBand, equipment, difficulty, drillId } = frontmatter;

  // Age band line: compose from frontmatter
  const ageBandParts = [
    ageBand.introducible ? `Introducible ${ageBand.introducible}` : null,
    ageBand.central && ageBand.central !== ageBand.introducible
      ? `Central ${ageBand.central}`
      : null,
  ].filter(Boolean);

  // Equipment: first two items
  const equipmentLine = equipment.slice(0, 2).join(', ');

  return (
    <article className="group flex flex-col rounded-xl border border-deepblue/10 bg-white/70 p-6 transition-shadow hover:shadow-md hover:shadow-deepblue/8">
      {/* Drill ID badge */}
      <span className="mb-3 self-start inline-flex items-center rounded-full border border-deepblue/20 bg-deepblue/5 px-2.5 py-0.5 text-xs font-semibold text-deepblue/60 font-ui tracking-wide">
        {drillId}
      </span>

      {/* Title */}
      <h3 className="mb-2 text-xl leading-snug text-deepblue font-heading group-hover:text-orange transition-colors">
        <Link
          href={`/training/${slug}`}
          className="hover:text-orange focus:outline-none focus-visible:underline"
        >
          {frontmatter.title}
        </Link>
      </h3>

      {/* Description */}
      <p className="mb-4 flex-1 text-sm leading-relaxed text-brown/70 font-body line-clamp-3">
        {frontmatter.description}
      </p>

      {/* Capacity chips */}
      <div className="mb-3">
        <CapacityChips
          primary={codexAnchors.capacities.primary}
          secondary={codexAnchors.capacities.secondary}
        />
      </div>

      {/* Age band */}
      {ageBandParts.length > 0 && (
        <p className="mb-2 text-xs text-brown/55 font-ui">
          {ageBandParts.join(' · ')}
        </p>
      )}

      {/* Equipment */}
      <p className="mb-3 text-xs text-brown/55 font-ui">{equipmentLine}</p>

      {/* Difficulty */}
      <DifficultyDots baseline={difficulty.baseline} elite={difficulty.elite} />

      {/* CTA */}
      <Link
        href={`/training/${slug}`}
        className="mt-4 self-start text-sm font-semibold text-deepblue hover:text-orange transition-colors font-ui"
        aria-label={`View drill: ${frontmatter.title}`}
      >
        View drill →
      </Link>
    </article>
  );
}
