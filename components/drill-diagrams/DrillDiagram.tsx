/**
 * DrillDiagram — top-level wrapper that renders a complete drill diagram SVG
 * from a JSON spec (DiagramSpec). Used on /training/[slug] detail pages.
 *
 * Renders:
 *   - Title above (Dosis, uppercase, tracking-widest, brown/60)
 *   - SVG with pitch background + all declared elements
 *   - Caption below (Play italic, brown/70, small)
 *
 * Output is a self-contained block. No external CSS beyond Tailwind utility classes.
 * Part of Style System v1 §6.6.
 */
import type { DiagramSpec, DrillElement } from './types';
import { PitchSmallBackground, PITCH_SMALL_VIEWBOX } from './PitchSmall';
import { PitchHalfBackground, PITCH_HALF_VIEWBOX } from './PitchHalf';
import { PitchFullBackground, PITCH_FULL_VIEWBOX } from './PitchFull';
import { Cone } from './Cone';
import { Player } from './Player';
import { Ball } from './Ball';
import { Arrow } from './Arrow';
import { Zone } from './Zone';
import { Label } from './Label';

/** Map pitch size to its viewBox string. */
const VIEWBOX: Record<DiagramSpec['pitch'], string> = {
  small: PITCH_SMALL_VIEWBOX,
  half: PITCH_HALF_VIEWBOX,
  full: PITCH_FULL_VIEWBOX,
};

/** Renders a single DrillElement. */
function renderElement(el: DrillElement, idx: number) {
  switch (el.type) {
    case 'cone':   return <Cone   key={idx} {...el} />;
    case 'player': return <Player key={idx} {...el} />;
    case 'ball':   return <Ball   key={idx} {...el} />;
    case 'arrow':  return <Arrow  key={idx} {...el} />;
    case 'zone':   return <Zone   key={idx} {...el} />;
    case 'label':  return <Label  key={idx} {...el} />;
    default:       return null;
  }
}

export interface DrillDiagramProps {
  /** Pitch background type */
  pitch: DiagramSpec['pitch'];
  /** Element list — rendered in declaration order */
  elements: DrillElement[];
  /** Optional title rendered above the SVG */
  title?: string;
  /** Optional caption rendered below the SVG */
  caption?: string;
}

/**
 * DrillDiagram renders a complete, self-contained diagram from a JSON spec.
 * Import from components/drill-diagrams.
 */
export function DrillDiagram({ pitch, elements, title, caption }: DrillDiagramProps) {
  const viewBox = VIEWBOX[pitch];

  return (
    <figure className="not-prose my-6 overflow-hidden rounded-lg border border-deepblue/15 bg-white">
      {/* Title */}
      {title && (
        <p className="px-4 pt-3 pb-1 font-ui text-[10px] uppercase tracking-widest text-brown/60">
          {title}
        </p>
      )}

      {/* SVG diagram */}
      <div className="px-3 pb-3">
        <svg
          viewBox={viewBox}
          role="img"
          aria-label={title ?? 'Drill diagram'}
          className="w-full max-w-[480px] block mx-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Pitch background */}
          {pitch === 'small' && <PitchSmallBackground />}
          {pitch === 'half'  && <PitchHalfBackground />}
          {pitch === 'full'  && <PitchFullBackground />}

          {/* Drill elements — rendered in declaration order (later = on top) */}
          {elements.map(renderElement)}
        </svg>
      </div>

      {/* Caption */}
      {caption && (
        <figcaption className="px-4 pb-3 font-body text-xs italic text-brown/70 leading-snug">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
