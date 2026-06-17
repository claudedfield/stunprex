// StunpreX cognitive games — single source of truth for the games section.
// Each game maps to football cognition + Codex capacity families. See
// Q1_Status/StunpreX_Cognitive_Games_Plan_v1.md and the per-game software plan.

export type Capacity =
  | 'Perceptual'
  | 'Cognitive'
  | 'Motor'
  | 'Communication'
  | 'Affective'
  | 'Adaptive';

export interface GameMeta {
  slug: string;
  name: string;
  /** One-line invitation. */
  tagline: string;
  /** What this honestly trains (one sentence, no transfer overclaim). */
  trains: string;
  /** The pitch moment it echoes. */
  echoes: string;
  capacities: Capacity[];
  status: 'live' | 'soon';
  /** Launch set ordering. */
  order: number;
}

/**
 * The standard honest-transfer disclosure. Ships on every game.
 * Required by the KB C8 evidence flag (screen→pitch transfer is Weak-to-Absent).
 */
export const HONEST_TRANSFER_NOTE =
  'This game trains the underlying capacity your game leans on. Direct transfer from screen to pitch is limited and debated — we don’t claim it makes you a better player. We claim it trains the capacity, scores you honestly, and is worth your ten minutes.';

export const GAMES: GameMeta[] = [
  {
    slug: 'koi-pond',
    name: 'Koi Pond',
    tagline: 'Feed the whole pond — once each. Remember who you’ve fed.',
    trains: 'Selective attention, multiple-object tracking, and working memory — holding which fish you’ve already fed as they move and mix.',
    echoes: 'Tracking bodies in motion when nothing labels who’s who.',
    capacities: ['Perceptual', 'Cognitive'],
    status: 'live',
    order: 1,
  },
  {
    slug: 'shoulder-check',
    name: 'Shoulder Check',
    tagline: 'Look around before the ball arrives. Then tell us what you saw.',
    trains: 'Scanning — gathering information from the edges before you act.',
    echoes: 'Xavi’s habit: the scan before the first touch (Conviction 5).',
    capacities: ['Perceptual'],
    status: 'live',
    order: 2,
  },
  {
    slug: 'commit-window',
    name: 'The Commit Window',
    tagline: 'Not too early, not too late. Go in the window.',
    trains: 'Timing and impulse control — acting at the right moment, not the first.',
    echoes: 'The 1v1 commit window.',
    capacities: ['Cognitive', 'Adaptive'],
    status: 'live',
    order: 3,
  },
  {
    slug: 'peripheral-pulse',
    name: 'Peripheral Pulse',
    tagline: 'Eyes centre. Catch what flickers at the edge.',
    trains: 'Peripheral detection while holding a central focus.',
    echoes: 'Sensing the run you never turned to look at.',
    capacities: ['Perceptual'],
    status: 'live',
    order: 4,
  },
  {
    slug: 'pass-lanes',
    name: 'Pass Lanes',
    tagline: 'Best option, before the lane closes.',
    trains: 'Decision-making under a closing clock.',
    echoes: 'Choosing the pass as defenders shut the angles (Conviction 3).',
    capacities: ['Cognitive', 'Perceptual'],
    status: 'soon',
    order: 5,
  },
  {
    slug: 'pattern-break',
    name: 'Pattern Break',
    tagline: 'Read the pattern. Catch the moment it changes.',
    trains: 'Anticipation, pattern recognition, and holding back the wrong response.',
    echoes: 'Reading a developing move and sensing when it breaks.',
    capacities: ['Cognitive', 'Adaptive'],
    status: 'soon',
    order: 6,
  },
  {
    slug: 'two-things-at-once',
    name: 'Two Things at Once',
    tagline: 'Keep the ball moving — and still answer the call.',
    trains: 'Divided attention: a tracking task and a decision task at the same time.',
    echoes: 'Dribbling while you scan (Conviction 30, cognitive load).',
    capacities: ['Cognitive', 'Motor'],
    status: 'soon',
    order: 7,
  },
  {
    slug: 'rondo-recall',
    name: 'Rondo Recall',
    tagline: 'Where was everyone? Don’t look again.',
    trains: 'Spatial working memory.',
    echoes: 'Knowing where teammates were without a second glance.',
    capacities: ['Cognitive', 'Perceptual'],
    status: 'soon',
    order: 8,
  },
  {
    slug: 'switch-the-play',
    name: 'Switch the Play',
    tagline: 'The rule just changed. Adapt now.',
    trains: 'Cognitive flexibility — switching rules without losing the thread.',
    echoes: 'The space or instruction changes and you adjust instantly.',
    capacities: ['Adaptive', 'Cognitive'],
    status: 'soon',
    order: 9,
  },
  {
    slug: 'hold-your-nerve',
    name: 'Hold Your Nerve',
    tagline: 'Composure as it gets loud.',
    trains: 'Focus under rising arousal (gentle, never punitive).',
    echoes: 'The penalty walk-up.',
    capacities: ['Affective'],
    status: 'soon',
    order: 10,
  },
];

export const getGame = (slug: string): GameMeta | undefined =>
  GAMES.find((g) => g.slug === slug);
