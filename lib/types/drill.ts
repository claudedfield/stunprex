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
