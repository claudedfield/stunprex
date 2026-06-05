// StunpreX blog — post type definitions
// Mirrors the frontmatter schema in brief §4. Every published post must carry Codex-anchor metadata.

export type AudienceLayer = 'Player' | 'Parent' | 'Coach' | 'Halo';

export type Category =
  | 'Methodology'
  | 'Drills'
  | 'Pro Breakdown'
  | 'Operational Core'
  | 'Reflections';

export type CategorySlug =
  | 'methodology'
  | 'drills'
  | 'pro-breakdown'
  | 'operational-core'
  | 'reflections';

export type CapacityFamily =
  | 'Perceptual'
  | 'Cognitive'
  | 'Motor'
  | 'Communication'
  | 'Affective'
  | 'Adaptive';

export type PostStatus = 'draft' | 'published';

export interface CodexAnchors {
  convictions: number[];
  /** Public-facing plain-language themes — rendered instead of conviction numbers. */
  convictionThemes?: string[];
  capacities: {
    primary: CapacityFamily;
    secondary?: CapacityFamily;
  };
  playerOperatingPrinciple?: string;
  antiPatternProtected?: string;
}

export interface PostFrontmatter {
  title: string;
  slug: string;
  date: string;              // ISO date string
  lastModified?: string;     // ISO date string; falls back to date
  description: string;
  audienceLayer: AudienceLayer;
  audienceLayerSecondary?: AudienceLayer;
  category: Category;
  codexAnchors: CodexAnchors;
  keywords: {
    primary: string;
    secondary: string[];
  };
  readingTime?: number;      // auto-computed; frontmatter value overrides
  ogImage?: string;
  canonical?: string;
  status: PostStatus;
}

/** Full post — frontmatter + source body for rendering */
export interface Post {
  frontmatter: PostFrontmatter;
  slug: string;
  readingTime: number;  // always computed; never undefined
  source: string;       // raw MDX string
}

/** Lightweight card-data — no source body, for list views */
export interface PostCard {
  frontmatter: PostFrontmatter;
  slug: string;
  readingTime: number;
}

export const CATEGORY_LABELS: Record<CategorySlug, Category> = {
  'methodology':      'Methodology',
  'drills':           'Drills',
  'pro-breakdown':    'Pro Breakdown',
  'operational-core': 'Operational Core',
  'reflections':      'Reflections',
};

export const CATEGORY_SLUGS: Record<Category, CategorySlug> = {
  'Methodology':      'methodology',
  'Drills':           'drills',
  'Pro Breakdown':    'pro-breakdown',
  'Operational Core': 'operational-core',
  'Reflections':      'reflections',
};
