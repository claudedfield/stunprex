/**
 * Player — a filled circle representing a player on the pitch.
 * Diameter 16px. Label (1–2 chars) rendered in white inside.
 * home=orange, opp=deepblue, neutral=brown/60.
 * Part of Style System v1 §6.6.
 */
import type { PlayerElement } from './types';

const TEAM_COLOR: Record<PlayerElement['team'], string> = {
  home: '#FA961C',      // orange
  opp: '#107099',       // deepblue
  neutral: 'rgba(71, 43, 8, 0.6)', // brown/60
};

const RADIUS = 10;

/**
 * Renders a single player circle with optional id label.
 */
export function Player({ x, y, team, id }: PlayerElement) {
  const fill = TEAM_COLOR[team];

  return (
    <>
      <circle cx={x} cy={y} r={RADIUS} fill={fill} />
      {id && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-dosis, Dosis, sans-serif)"
          fontWeight={700}
          fill="#ffffff"
        >
          {id}
        </text>
      )}
    </>
  );
}
