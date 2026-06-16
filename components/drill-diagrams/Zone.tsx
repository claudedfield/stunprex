/**
 * Zone — a translucent rectangular zone highlighting a training area.
 * Fill: deepblue/15. Optional centred label in Dosis.
 * Part of Style System v1 §6.6.
 */
import type { ZoneElement } from './types';

const DEEPBLUE_15 = 'rgba(16, 112, 153, 0.15)';
const DEEPBLUE_30 = 'rgba(16, 112, 153, 0.3)';
const DEEPBLUE = '#107099';

/** Renders a zone rectangle with optional label. */
export function Zone({ x, y, width, height, label }: ZoneElement) {
  const cx = x + width / 2;
  const cy = y + height / 2;

  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={DEEPBLUE_15}
        stroke={DEEPBLUE_30}
        strokeWidth={1}
        strokeDasharray="4,3"
      />
      {label && (
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-dosis, Dosis, sans-serif)"
          fontWeight={600}
          fill={DEEPBLUE}
          style={{ textTransform: 'uppercase' }}
        >
          {label}
        </text>
      )}
    </>
  );
}
