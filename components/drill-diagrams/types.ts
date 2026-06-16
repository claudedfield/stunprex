/**
 * StunpreX Drill Diagram System — Type definitions.
 * Part of Style System v1 §6.6.
 * All colours are locked to the four-colour brand palette (Blueprint v2.1 §7).
 */

/** Cone colours — brand palette only. */
export type ConeColor = 'deepblue' | 'orange' | 'brown';

/** Player team identity — drives fill colour. */
export type PlayerTeam = 'home' | 'opp' | 'neutral';

/**
 * Arrow semantic type — determines colour and stroke style.
 * pass: orange solid. run: deepblue dashed. dribble: deepblue wavy.
 */
export type ArrowKind = 'pass' | 'run' | 'dribble';

/** Optional override on arrow stroke style. */
export type ArrowStyle = 'solid' | 'dashed';

/** Pitch background size. */
export type PitchSize = 'full' | 'half' | 'small';

// ─── Element shapes ────────────────────────────────────────────────────────────

/** A cone placed at (x, y). Optional single-letter label. */
export interface ConeElement {
  type: 'cone';
  x: number;
  y: number;
  /** Default: deepblue */
  color?: ConeColor;
  /** Single letter label, rendered below cone */
  label?: string;
}

/** A player circle at (x, y). */
export interface PlayerElement {
  type: 'player';
  x: number;
  y: number;
  /** home = orange, opp = deepblue, neutral = brown/60 */
  team: PlayerTeam;
  /** Optional positional role badge (e.g. 'GK') */
  role?: string;
  /** Displayed inside the circle (1–2 chars) */
  id?: string;
}

/** A ball at (x, y). */
export interface BallElement {
  type: 'ball';
  x: number;
  y: number;
  state?: 'rolling' | 'static';
}

/**
 * A directional arrow from (x1, y1) to (x2, y2).
 * kind drives colour + stroke: pass=orange-solid, run=deepblue-dashed, dribble=deepblue-wavy.
 */
export interface ArrowElement {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: ArrowKind;
  /** Optional stroke-style override (default: determined by kind) */
  style?: ArrowStyle;
}

/** A translucent rectangular zone, used to highlight areas. */
export interface ZoneElement {
  type: 'zone';
  x: number;
  y: number;
  width: number;
  height: number;
  /** Optional text label centred in the zone */
  label?: string;
}

/** A small Dosis text label at (x, y). */
export interface LabelElement {
  type: 'label';
  x: number;
  y: number;
  text: string;
}

/** Union of all drill element types. */
export type DrillElement =
  | ConeElement
  | PlayerElement
  | BallElement
  | ArrowElement
  | ZoneElement
  | LabelElement;

/** A single diagram spec — maps to one rendered SVG block. */
export interface DiagramSpec {
  /** Unique id within the drill (used for export filenames) */
  id: string;
  pitch: PitchSize;
  /** Displayed above the SVG in Dosis uppercase */
  title?: string;
  /** Displayed below the SVG in Play italic */
  caption?: string;
  elements: DrillElement[];
}
