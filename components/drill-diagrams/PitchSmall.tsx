/**
 * PitchSmall — 400×400 training-area pitch background.
 * Represents a small-sided or training-ground space (~10m × 10m).
 * Pitch markings are subtle: thin deepblue/30 lines on a mint fill.
 * The drill elements (cones, players, arrows) are the visual centre.
 * Part of Style System v1 §6.6.
 */

// Brand colours — locked per Blueprint v2.1 §7.
const MINT = '#F5FAF5';
const DEEPBLUE_30 = 'rgba(16, 112, 153, 0.3)';
const DEEPBLUE_15 = 'rgba(16, 112, 153, 0.15)';

export const PITCH_SMALL_VIEWBOX = '0 0 400 400';

/** Renders pitch background into the current SVG context. Use inside a parent <svg>. */
export function PitchSmallBackground() {
  return (
    <>
      {/* Background fill */}
      <rect width={400} height={400} fill={MINT} />

      {/* Outer boundary — the training area */}
      <rect
        x={22} y={22} width={356} height={356}
        fill="none"
        stroke={DEEPBLUE_30}
        strokeWidth={1.5}
        rx={2}
      />

      {/* Subtle centre cross — dashed, very light */}
      <line
        x1={200} y1={22} x2={200} y2={378}
        stroke={DEEPBLUE_15}
        strokeWidth={1}
        strokeDasharray="3,6"
      />
      <line
        x1={22} y1={200} x2={378} y2={200}
        stroke={DEEPBLUE_15}
        strokeWidth={1}
        strokeDasharray="3,6"
      />
    </>
  );
}
