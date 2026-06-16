/**
 * Arrow — a directional arrow for drill movement notation.
 *
 * Semantic types (colours and styles are non-negotiable per Style System §6.6):
 *   pass    → thin solid orange arrow
 *   run     → dashed deepblue arrow
 *   dribble → wavy (sinusoidal) deepblue arrow
 *
 * Part of Style System v1 §6.6.
 */
import type { ArrowElement } from './types';

const ORANGE = '#FA961C';
const DEEPBLUE = '#107099';
const ARROWHEAD_SIZE = 8;

/** Generates the SVG path string for a wavy (dribble) arrow. */
function wavyPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;

  const ux = dx / len; // unit along line
  const uy = dy / len;
  const nx = -uy; // unit normal
  const ny = ux;

  const waves = 4; // number of half-cycles
  const amplitude = 6;
  let d = `M ${x1} ${y1}`;

  for (let i = 0; i < waves; i++) {
    const t0 = i / waves;
    const t1 = (i + 0.5) / waves;
    const t2 = (i + 1) / waves;

    // Midpoint of this half-wave, offset perpendicular
    const side = i % 2 === 0 ? amplitude : -amplitude;
    const mx = x1 + dx * t1 + nx * side;
    const my = y1 + dy * t1 + ny * side;

    // End of this half-wave (on the baseline)
    const ex = x1 + dx * t2;
    const ey = y1 + dy * t2;

    // Use quadratic bezier: control point at midpoint offset
    // but we need the previous endpoint to control continuity
    const startX = x1 + dx * t0;
    const startY = y1 + dy * t0;

    // Two control points for a cubic bezier (smoother)
    const c1x = startX + dx / waves * 0.25 + nx * side * 0.8;
    const c1y = startY + dy / waves * 0.25 + ny * side * 0.8;
    const c2x = ex - dx / waves * 0.25 + nx * side * 0.8;
    const c2y = ey - dy / waves * 0.25 + ny * side * 0.8;

    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`;
  }

  return d;
}

/** Generates SVG path for an arrowhead at (x2, y2) pointing from (x1, y1). */
function arrowHeadPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const spread = Math.PI / 6; // 30°
  const s = ARROWHEAD_SIZE;

  const ax1 = x2 - s * Math.cos(angle - spread);
  const ay1 = y2 - s * Math.sin(angle - spread);
  const ax2 = x2 - s * Math.cos(angle + spread);
  const ay2 = y2 - s * Math.sin(angle + spread);

  return `M ${ax1} ${ay1} L ${x2} ${y2} L ${ax2} ${ay2}`;
}

/** Shortens endpoint so arrowhead doesn't overlap target element. */
function shortenEnd(
  x1: number, y1: number, x2: number, y2: number, by: number,
): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len <= by) return [x1, y1];
  const t = (len - by) / len;
  return [x1 + dx * t, y1 + dy * t];
}

/** Renders a drill arrow between two points. */
export function Arrow({ x1, y1, x2, y2, kind, style }: ArrowElement) {
  const isPass = kind === 'pass';
  const isDribble = kind === 'dribble';
  const isRun = kind === 'run';

  const stroke = isPass ? ORANGE : DEEPBLUE;
  const strokeWidth = 2;

  // Shorten end by player radius + arrowhead size to avoid overlap
  const [ex, ey] = shortenEnd(x1, y1, x2, y2, 14);

  // Stroke dash: run = dashed, pass/dribble = solid
  const dashArray = isRun || style === 'dashed' ? '6,4' : undefined;

  const arrowHead = arrowHeadPath(x1, y1, ex, ey);

  if (isDribble) {
    const d = wavyPath(x1, y1, ex, ey);
    return (
      <>
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={arrowHead}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  }

  return (
    <>
      <line
        x1={x1} y1={y1} x2={ex} y2={ey}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
      />
      <path
        d={arrowHead}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
