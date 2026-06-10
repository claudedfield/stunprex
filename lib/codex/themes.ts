/**
 * Codex theme mappings for capacity families and age bands.
 * Used by /capacities/[family] and /age-bands/[band] "In the Codex" anchor blocks.
 */
import type { CapacityFamily } from '@/lib/types/drill'

// ─── Capacity families ─────────────────────────────────────────────────────────

export const CAPACITY_FAMILIES = [
  'Perceptual',
  'Cognitive',
  'Motor',
  'Communication',
  'Affective',
  'Adaptive',
] as const

export type CapacityFamilySlug =
  | 'perceptual'
  | 'cognitive'
  | 'motor'
  | 'communication'
  | 'affective'
  | 'adaptive'

export const CAPACITY_SLUG_TO_FAMILY: Record<CapacityFamilySlug, CapacityFamily> = {
  perceptual:    'Perceptual',
  cognitive:     'Cognitive',
  motor:         'Motor',
  communication: 'Communication',
  affective:     'Affective',
  adaptive:      'Adaptive',
}

export const CAPACITY_FAMILY_TO_SLUG: Record<CapacityFamily, CapacityFamilySlug> = {
  Perceptual:    'perceptual',
  Cognitive:     'cognitive',
  Motor:         'motor',
  Communication: 'communication',
  Affective:     'affective',
  Adaptive:      'adaptive',
}

export const CAPACITY_DESCRIPTIONS: Record<CapacityFamily, string> = {
  Perceptual:    'What the player sees, hears, and senses before deciding.',
  Cognitive:     'Decision-making under constraint, attention, working memory.',
  Motor:         'Ball mastery, agility, coordination, the foot\'s vocabulary.',
  Communication: 'Reading and signalling between players, on and off the ball.',
  Affective:     'Focus, composure, resilience — the emotional substrate of performance.',
  Adaptive:      'Adjusting in real time to surface, opponent, weather, and the unexpected.',
}

export const CAPACITY_LEAD: Record<CapacityFamily, string> = {
  Perceptual:
    'Before any decision happens, the player must perceive: scan, read body posture, sense space. Perceptual capacity is trained, not inherited — and it is the first bottleneck for most developing players.',
  Cognitive:
    'Recognising a pattern is not the same as knowing what to do with it. Cognitive capacity is what bridges perception and action — under pressure, with limited time, against opponents who are also adapting.',
  Motor:
    'Technical mastery is non-negotiable. Ball mastery, first touch, both-feet execution, agility under load — these cannot be bypassed or substituted. Motor capacity is the floor every other capacity stands on.',
  Communication:
    'Football is a team game played by individuals who must constantly signal, read, and respond to each other. Communication capacity covers verbal and non-verbal cues, runs, pressing triggers, and tactical signalling.',
  Affective:
    'The best technical and tactical preparation collapses under emotional dysregulation. Affective capacity — composure, focus, resilience after error, sustained effort — underpins all other performance capacities.',
  Adaptive:
    'No two pitches, opponents, or weather conditions are the same. Players who train exclusively on grass in ideal conditions are not fully prepared. Adaptive capacity is built through variability, constraint, and the unexpected.',
}

export const CAPACITY_THEMES: Record<CapacityFamily, string[]> = {
  Perceptual: [
    'Scanning is a habit, not a gift',
    'Decision-making is the ceiling (perception precedes decision)',
  ],
  Cognitive: [
    'Decision-making is the ceiling',
    'Cognitive load matters',
    'Constraints generate creativity',
  ],
  Motor: [
    'First touch is the foundation skill',
    'Both feet, or half a player',
    'Ball mastery is irreplaceable',
  ],
  Communication: [
    'The player is the protagonist (signalling, not waiting)',
  ],
  Affective: [
    'Process before outcome',
    'Failure is data',
    'Self-assessment is a skill',
  ],
  Adaptive: [
    'Variability builds robustness',
    'Training must overdo gameplay complexity',
  ],
}

// ─── Age bands ─────────────────────────────────────────────────────────────────

export const AGE_BAND_SLUGS = ['5-8', '9-12', '13-16', '17-20', 'adult'] as const
export type AgeBandSlug = (typeof AGE_BAND_SLUGS)[number]

export const AGE_BAND_LABELS: Record<AgeBandSlug, string> = {
  '5-8':   '5–8 (First touch)',
  '9-12':  '9–12 (Foundation)',
  '13-16': '13–16 (Development)',
  '17-20': '17–20 (Specialisation)',
  'adult': 'Adult',
}

export const AGE_BAND_DESCRIPTIONS: Record<AgeBandSlug, string> = {
  '5-8':   'The window for ball-as-friend, free play, and joyful exploration.',
  '9-12':  'Habits set: scan, both feet, decision-making, position rotation.',
  '13-16': 'Capacity work intensifies; specialisation begins to inform — but never lock — position.',
  '17-20': 'Position-specific refinement, tactical depth, transition to senior football.',
  'adult': 'Maintenance, refinement, longevity in the game.',
}

export const AGE_BAND_LEAD: Record<AgeBandSlug, string> = {
  '5-8':
    'Ages 5–8 are not for volume or serious coaching. They are for falling in love with the ball. Joyful, unstructured, exploratory contact with the game builds the foundation that structured training will later develop. Early pressure and specialisation in this window does more harm than good.',
  '9-12':
    'Between 9 and 12 the important habits form — or don\'t. Scanning frequency, two-footed comfort, basic decision-making under pressure, and position rotation are all established in this window. StunpreX drills at this band prioritise repetition of foundational mechanics inside game-like constraints.',
  '13-16':
    'Capacity work intensifies in the 13–16 band. Players have enough physical maturity to sustain more structured load, and enough technical foundation to work on decision quality and tactical awareness. Position identity begins to form — but remains exploratory; locking early narrows long-term ceiling.',
  '17-20':
    'Players in the 17–20 band are refining, not building from scratch. Tactical depth, position-specific execution, game management, and the transition to senior football are the focal areas. Foundational gaps from earlier bands become visible here — and are harder to close.',
  'adult':
    'Adult players maintain, refine, and sometimes repair foundations they never fully built. The Codex applies across the lifespan — it is never too late to improve perceptual habits, two-footed execution, or affective composure. Longevity in the game depends on keeping the work intelligent.',
}

export const AGE_BAND_THEMES: Record<AgeBandSlug, string[]> = {
  '5-8':   ['Joy is not optional', 'Ball-as-friend before ball-as-tool'],
  '9-12':  ['Scanning is a habit, not a gift', 'Both feet, or half a player', 'Process before outcome'],
  '13-16': ['Develop the player, not the position', 'Constraints generate creativity', 'Decision-making is the ceiling'],
  '17-20': ['First touch is the foundation skill', 'Failure is data', 'Self-assessment is a skill'],
  'adult': ['Variability builds robustness', 'Process before outcome'],
}

/** Normalises a band slug like "9-12" to the en-dash form "9–12" for frontmatter matching */
export function bandSlugToMatchString(slug: AgeBandSlug): string {
  if (slug === 'adult') return 'Adult'
  return slug.replace('-', '–') // hyphen → en-dash
}
