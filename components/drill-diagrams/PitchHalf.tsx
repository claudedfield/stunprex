/**
 * PitchHalf — 525×680 half-pitch background (half length, full width).
 * Shows: outer boundary, penalty box, goal, goal arc, halfway line stub.
 * Markings are subtle: thin deepblue/30 lines on a mint fill.
 * Part of Style System v1 §6.6.
 */

const MINT = '#F5FAF5';
const DEEPBLUE_30 = 'rgba(16, 112, 153, 0.3)';
const DEEPBLUE_15 = 'rgba(16, 112, 153, 0.15)';

export const PITCH_HALF_VIEWBOX = '0 0 525 680';

/** Renders half-pitch background into the current SVG context. */
export function PitchHalfBackground() {
  // Scale: 525px wide = 68m; 680px tall = ~52.5m (half of 105m)
  // Penalty box: 40.32m wide × 16.5m deep → 311px × 123px, centred
  // Penalty box offset: (525 - 311) / 2 = 107px from side
  // Goal: 7.32m wide → 56px, centred → offset (525-56)/2 = 234.5px
  // Goal depth: ~7px (nominal)

  const PB_X = 107; // penalty box left
  const PB_W = 311; // penalty box width
  const PB_D = 123; // penalty box depth (from top line = goal end)
  const GOAL_X = (525 - 56) / 2; // ~234
  const GOAL_W = 56;
  const GOAL_D = 10;
  const TOP_Y = 22;

  return (
    <>
      {/* Background */}
      <rect width={525} height={680} fill={MINT} />

      {/* Outer boundary */}
      <rect
        x={22} y={TOP_Y} width={481} height={636}
        fill="none"
        stroke={DEEPBLUE_30}
        strokeWidth={1.5}
      />

      {/* Halfway line at bottom */}
      <line x1={22} y1={658} x2={503} y2={658} stroke={DEEPBLUE_15} strokeWidth={1} strokeDasharray="4,4" />

      {/* Penalty box */}
      <rect
        x={PB_X} y={TOP_Y} width={PB_W} height={PB_D}
        fill="none"
        stroke={DEEPBLUE_30}
        strokeWidth={1}
      />

      {/* Goal */}
      <rect
        x={GOAL_X} y={TOP_Y - GOAL_D} width={GOAL_W} height={GOAL_D}
        fill="none"
        stroke={DEEPBLUE_30}
        strokeWidth={1.5}
      />

      {/* Penalty spot */}
      <circle cx={262.5} cy={TOP_Y + 80} r={2.5} fill={DEEPBLUE_30} />

      {/* Centre line stub at top (just outside box, shows field edge) */}
      <line
        x1={22} y1={TOP_Y + PB_D + 60}
        x2={503} y2={TOP_Y + PB_D + 60}
        stroke={DEEPBLUE_15} strokeWidth={1} strokeDasharray="3,6"
      />
    </>
  );
}
