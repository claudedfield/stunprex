/**
 * StunpreX Drill Library — type definitions for MDX drill content.
 * Mirrors the frontmatter schema in drill MDX files.
 */
import type { DiagramSpec } from '@/components/drill-diagrams/types';

export type DrillStatus = 'draft' | 'published';

export type CapacityFamily =
  | 'Perceptual'
  | 'Cognitive'
  | 'Motor'
  | 'Communication'
  | 'Affective'
  | 'Adaptive';

export type AgeBand =
  | '5-8'
  | '9-12'
  | '13-16'
  | '17-20'
  | '21+';

/** Football theme / category — one per drill. Drives the /training Category facet. */
export type DrillCategory =
  | 'Scanning'
  | 'First touch & receiving'
  | 'Dribbling & ball mastery'
  | 'Attacking 1v1'
  | 'Running with the ball'
  | 'Passing & possession'
  | 'Finishing'
  | 'Crossing & wide play'
  | 'Set pieces'
  | 'Heading & aerial'
  | 'Defending'
  | 'Transition'
  | 'Goalkeeping'
  | 'Conditioning'
  | 'Communication'
  | 'Composure & mindset'
  | 'Adaptive & game sense';

/** Ordered facet lists (stable display order in the /training filter UI). */
export const CAPACITY_FAMILIES: CapacityFamily[] = [
  'Perceptual', 'Cognitive', 'Motor', 'Communication', 'Affective', 'Adaptive',
];

export const AGE_BANDS: AgeBand[] = ['5-8', '9-12', '13-16', '17-20', '21+'];

export const DRILL_CATEGORIES: DrillCategory[] = [
  'Scanning',
  'First touch & receiving',
  'Dribbling & ball mastery',
  'Attacking 1v1',
  'Running with the ball',
  'Passing & possession',
  'Finishing',
  'Crossing & wide play',
  'Set pieces',
  'Heading & aerial',
  'Defending',
  'Transition',
  'Goalkeeping',
  'Conditioning',
  'Communication',
  'Composure & mindset',
  'Adaptive & game sense',
];

export interface DrillFrontmatter {
  /** Human-readable drill title */
  title: string;
  /** URL slug — matches the MDX filename without extension */
  slug: string;
  /** Drill library ID (e.g. SX-DR-001) */
  drillId: string;
  /** One-sentence description for SEO and cards */
  description: string;
  /** draft | published */
  status: DrillStatus;
  /** Football theme / category (one per drill) — drives the /training Category facet. */
  category?: DrillCategory;
  /** Capacity families trained — drives cross-linking pages */
  capacities: {
    primary: CapacityFamily[];
    secondary?: CapacityFamily[];
  };
  /** Age bands where this drill is applicable */
  ageBand: AgeBand[];
  /** Player count description (e.g. "1–3") */
  players: string;
  /** Equipment summary */
  equipment: string;
  /** Difficulty 1–5 */
  difficulty: number;
  /** Max difficulty level (usually 5) */
  maxDifficulty?: number;
  /** Conviction numbers from the Codex instantiated by this drill */
  convictions: number[];
  /** Player Operating Principle reinforced */
  playerOperatingPrinciple?: string;
  /** Diagrams to render on the detail page — array of DiagramSpec */
  diagrams?: DiagramSpec[];
}

/** Full drill object — frontmatter + MDX source body for rendering */
export interface Drill {
  frontmatter: DrillFrontmatter;
  slug: string;
  source: string;
}

/** Lightweight card — frontmatter only, no source */
export interface DrillCard {
  frontmatter: DrillFrontmatter;
  slug: string;
}
