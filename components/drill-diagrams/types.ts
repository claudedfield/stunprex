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

// ─── Animation layer (Drill Animation System v1 — additive) ─────────────────────
// Optional `entities` + `animation` block on a diagram. Existing static diagrams
// (no animation) and prose-only drills are unaffected — see the fallback ladder in
// AnimatedDrillDiagram / the drill page: animation → static → prose.

/** A point in the diagram coordinate space (same space as element x/y). */
export interface Point {
  x: number;
  y: number;
}

/** Entity kinds that can be declared in an animation. Mirror the renderable elements. */
export type AnimatedEntityType = 'player' | 'ball' | 'cone' | 'zone' | 'label';

/**
 * A stable, animatable object on the pitch. Carries the visual props of its
 * element type plus a stable `id` referenced by animation steps. Movers get
 * `moves` in the steps; static props (cones, labels, zones) are declared once
 * and simply never move.
 */
export interface AnimatedEntity {
  /** Stable id — referenced by `moves[].id`, `to`, and `attachedTo`. Unique within the diagram. */
  id: string;
  type: AnimatedEntityType;
  /** Initial x in diagram space. */
  x: number;
  /** Initial y in diagram space. */
  y: number;
  // ── player ──
  /** home = orange, opp = deepblue, neutral = brown/60. */
  team?: PlayerTeam;
  /** Visible label: player-circle text, cone letter, label text, or zone caption. */
  label?: string;
  // ── ball ──
  /** Ball follows this entity id every frame until a step overrides it. */
  attachedTo?: string;
  /** Ball visual state. */
  state?: BallElement['state'];
  // ── cone ──
  color?: ConeColor;
  // ── zone ──
  width?: number;
  height?: number;
}

/**
 * A single move applied across a step.
 * `to` is either another entity's id (snap to it) or an explicit point.
 * `attachedTo` re-parents this entity to follow another (e.g. ball → player); `null` detaches.
 */
export interface AnimationMove {
  /** Entity id to move. */
  id: string;
  /** Destination: another entity's id (snap to it) or an explicit {x,y}. */
  to?: string | Point;
  /** Re-attach this entity to follow another entity id; `null` detaches. */
  attachedTo?: string | null;
}

/**
 * A timed animation step. The renderer interpolates entity positions across the
 * step with ease-in-out. `moves: []` is a held beat (e.g. a scan).
 */
export interface AnimationStep {
  /** Step length in milliseconds. */
  duration: number;
  /** Narration shown while the step plays / as an ordered-list item under reduced-motion. */
  caption: string;
  /** Entity moves applied across this step. */
  moves: AnimationMove[];
}

/** The optional animation block on a diagram. */
export interface AnimationSpec {
  /** Repeat from the first step when the last finishes. Default: false. */
  loop?: boolean;
  steps: AnimationStep[];
}

/** A single diagram spec — maps to one rendered SVG block. */
export interface DiagramSpec {
  /** Unique id within the drill (used for export filenames) */
  id: string;
  pitch: PitchSize;
  /** Displayed above the SVG in Dosis uppercase */
  title?: string;
  /** Displayed below the SVG in Play italic */
  caption?: string;
  /** Static elements — the static diagram + the reduced-motion / no-animation fallback. */
  elements?: DrillElement[];
  /** Animatable entities (movers + static props). Present only on animated diagrams. */
  entities?: AnimatedEntity[];
  /** Timed animation steps. When present (with entities), the diagram animates. */
  animation?: AnimationSpec;
}
