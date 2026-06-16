/**
 * Label — a small Dosis-font text label at an arbitrary position.
 * Uppercase, tracking-wider, brown/60 by default.
 * Part of Style System v1 §6.6.
 */
import type { LabelElement } from './types';

const BROWN_60 = 'rgba(71, 43, 8, 0.6)';

/** Renders a small diagram label. */
export function Label({ x, y, text }: LabelElement) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={9}
      fontFamily="var(--font-dosis, Dosis, sans-serif)"
      fontWeight={600}
      fill={BROWN_60}
      letterSpacing="0.06em"
    >
      {text.toUpperCase()}
    </text>
  );
}
