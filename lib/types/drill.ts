// StunpreX drill library — TypeScript types
// Parallel to lib/types/post.ts

export interface DrillDifficulty {
  baseline: number; // 1–5
  elite: number;    // 1–5
}

export interface DrillAgeBand {
  introducible: string; // e.g. "9–12 Foundation"
  central: string;
  maintenance: string;
}

export interface DrillCodexAnchors {
  convictionThemes: string[];
  capacities: {
    primary: string[];
    secondary: string[];
  };
  playerOperatingPrinciple: string;
}

export interface DrillFrontmatter {
  title: string;
  slug: string;
  drillId: string;
  date: string;
  lastModified: string;
  description: string;
  codexAnchors: DrillCodexAnchors;
  ageBand: DrillAgeBand;
  players: string;
  duration: string;
  environment: string;
  equipment: string[];
  difficulty: DrillDifficulty;
  primaryObjectives: string[];
  status: 'published' | 'draft';
}

export interface Drill {
  frontmatter: DrillFrontmatter;
  slug: string;
  source: string; // raw MDX body
}

export interface DrillCard {
  frontmatter: DrillFrontmatter;
  slug: string;
}

export type CapacityFamily =
  | 'Perceptual'
  | 'Cognitive'
  | 'Motor'
  | 'Communication'
  | 'Affective'
  | 'Adaptive';

export const ALL_CAPACITY_FAMILIES: CapacityFamily[] = [
  'Perceptual',
  'Cognitive',
  'Motor',
  'Communication',
  'Affective',
  'Adaptive',
];

export const AGE_BANDS = ['5–8', '9–12', '13–16', '17–20', 'Adult'] as const;
export type AgeBandFilter = (typeof AGE_BANDS)[number];
