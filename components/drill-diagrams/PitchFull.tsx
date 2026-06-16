/**
 * PitchFull — 1050×680 full-pitch background (105m × 68m proportions).
 * Shows: outer boundary, halfway line, centre circle, two penalty boxes, goals.
 * Markings are subtle: thin deepblue/30 lines on a mint fill.
 * Part of Style System v1 §6.6.
 */

const MINT = '#F5FAF5';
const DEEPBLUE_30 = 'rgba(16, 112, 153, 0.3)';
const DEEPBLUE_15 = 'rgba(16, 112, 153, 0.15)';

export const PITCH_FULL_VIEWBOX = '0 0 1050 680';

/** Renders full-pitch background into the current SVG context. */
export function PitchFullBackground() {
  // Scale: 1050px = 105m → 10px/m; 680px = 68m → 10px/m
  // Penalty box: 40.32m × 16.5m → 403px × 165px, centred vertically
  //   left box: from left edge (22px)
  //   right box: from right edge (1028px)
  // Goal: 7.32m wide → 73px, centred → y = (680-73)/2 = 303.5
  // Centre circle: r = 9.15m = 91.5px, cx=525, cy=340

  const PB_W = 403;  // penalty box width (along pitch length)
  const PB_H = 165;  // penalty box height (across pitch width)
  const PB_Y = (680 - PB_H) / 2; // centred at 257.5
  const GOAL_H = 73;
  const GOAL_DEPTH = 10;
  const GOAL_Y = (680 - GOAL_H) / 2; // centred at 303.5
  const LEFT = 22;
  const RIGHT = 1028;
  const TOP = 16;
  const BOT = 664;

  return (
    <>
      {/* Background */}
      <rect width={1050} height={680} fill={MINT} />

      {/* Outer boundary */}
      <rect
        x={LEFT} y={TOP} width={RIGHT - LEFT} height={BOT - TOP}
        fill="none"
        stroke={DEEPBLUE_30}
        strokeWidth={1.5}
      />

      {/* Halfway line */}
      <line x1={525} y1={TOP} x2={525} y2={BOT} stroke={DEEPBLUE_30} strokeWidth={1} />

      {/* Centre circle */}
      <circle cx={525} cy={340} r={91.5} fill="none" stroke={DEEPBLUE_30} strokeWidth={1} />
      <circle cx={525} cy={340} r={3} fill={DEEPBLUE_30} />

      {/* Left penalty box */}
      <rect
        x={LEFT} y={PB_Y} width={PB_W} height={PB_H}
        fill="none" stroke={DEEPBLUE_30} strokeWidth={1}
      />
      {/* Left goal */}
      <rect
        x={LEFT - GOAL_DEPTH} y={GOAL_Y} width={GOAL_DEPTH} height={GOAL_H}
        fill="none" stroke={DEEPBLUE_30} strokeWidth={1.5}
      />
      {/* Left penalty spot */}
      <circle cx={LEFT + 110} cy={340} r={2.5} fill={DEEPBLUE_30} />

      {/* Right penalty box */}
      <rect
        x={RIGHT - PB_W} y={PB_Y} width={PB_W} height={PB_H}
        fill="none" stroke={DEEPBLUE_30} strokeWidth={1}
      />
      {/* Right goal */}
      <rect
        x={RIGHT} y={GOAL_Y} width={GOAL_DEPTH} height={GOAL_H}
        fill="none" stroke={DEEPBLUE_30} strokeWidth={1.5}
      />
      {/* Right penalty spot */}
      <circle cx={RIGHT - 110} cy={340} r={2.5} fill={DEEPBLUE_30} />

      {/* Corner arcs (very subtle) */}
      {[
        [LEFT, TOP], [RIGHT, TOP], [LEFT, BOT], [RIGHT, BOT],
      ].map(([cx, cy], i) => {
        const sx = cx === LEFT ? 1 : -1;
        const sy = cy === TOP ? 1 : -1;
        const r = 10;
        return (
          <path
            key={i}
            d={`M ${cx + sx * r} ${cy} A ${r} ${r} 0 0 ${cx === LEFT ? 1 : 0} ${cx} ${cy + sy * r}`}
            fill="none"
            stroke={DEEPBLUE_15}
            strokeWidth={1}
          />
        );
      })}
    </>
  );
}
