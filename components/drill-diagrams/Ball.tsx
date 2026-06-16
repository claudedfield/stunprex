/**
 * Ball — a small white circle with deepblue border representing the ball.
 * Diameter ~8px. Rolling variant has a subtle motion dash.
 * Part of Style System v1 §6.6.
 */
import type { BallElement } from './types';

const DEEPBLUE = '#107099';
const RADIUS = 5;

/** Renders a football at (x, y). */
export function Ball({ x, y, state = 'static' }: BallElement) {
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={RADIUS}
        fill="#ffffff"
        stroke={DEEPBLUE}
        strokeWidth={1.5}
      />
      {/* Rolling indicator: short dashed trail */}
      {state === 'rolling' && (
        <line
          x1={x - RADIUS - 4}
          y1={y}
          x2={x - RADIUS - 10}
          y2={y}
          stroke={DEEPBLUE}
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.5}
        />
      )}
    </>
  );
}
