/**
 * Cone — a small triangle glyph representing a training cone.
 * Base diameter ~12px. Optional single-letter label below.
 * Part of Style System v1 §6.6.
 */
import type { ConeElement } from './types';

const COLOR_MAP: Record<NonNullable<ConeElement['color']>, string> = {
  deepblue: '#107099',
  orange: '#FA961C',
  brown: '#472B08',
};

/**
 * Renders a single cone.
 * @param x - SVG x centre
 * @param y - SVG y centre (tip of the cone)
 */
export function Cone({ x, y, color = 'deepblue', label }: ConeElement) {
  const fill = COLOR_MAP[color];
  const r = 7; // half base width
  const h = 13; // cone height

  // Triangle: tip at (x, y - h/2 + 2), base at y + h/2 - 2
  const tipY = y - 5;
  const baseY = y + 8;
  const points = `${x},${tipY} ${x - r},${baseY} ${x + r},${baseY}`;

  return (
    <>
      <polygon points={points} fill={fill} />
      {label && (
        <text
          x={x}
          y={baseY + 11}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-dosis, Dosis, sans-serif)"
          fontWeight={600}
          fill={fill}
        >
          {label}
        </text>
      )}
    </>
  );
}
