/**
 * Codex Release 1 — pinned conviction identifiers (set v1.0.1, 24 Aug 2026).
 *
 * GENERATED from canon: Codex_Volumes/_registry/id_crosswalk.md.
 * Canon lives outside this repository, so the frozen set is vendored here and
 * pinned to Release 1. If canon cuts a new release, regenerate this file —
 * do not hand-edit it.
 *
 * These IDs are INTERNAL metadata only. They are never rendered on any public
 * surface (D-WEB-05 stands: no public "Conviction N" citations anywhere; the
 * only sanctioned public Codex mention is the /terms IP clause, D-TERMS-CODEX).
 */

export const CONVICTION_TITLES: Readonly<Record<number, string>> = {
  1: "Greatness is trained, not born",
  2: "The player builds the rare combination, not the rare individual",
  3: "The first habits set deepest",
  4: "The horizon is long; ego is short",
  5: "Process before outcome",
  6: "Players compete for results; coaches measure development",
  7: "Decision-making is the ceiling",
  8: "First touch is the foundation skill",
  9: "Scanning and anticipation are habits, not gifts",
  10: "Both feet, or half a player",
  11: "Ball mastery is irreplaceable",
  12: "Individual tactics are taught, not absorbed",
  13: "Position-fluid through age 14 — including within matches",
  14: "The goalkeeper is a complete footballer",
  15: "Holism is non-negotiable",
  16: "Strength before speed; mobility before strength",
  17: "Specificity wins — and general foundations transfer",
  18: "Recovery is training",
  19: "Multi-sport — broadly defined — before specialisation",
  20: "Train harder than you play — denser, not more exhausting",
  21: "Quality reps beat distracted volume — and quality at scale wins",
  22: "Cognitive load matters",
  23: "Variability builds robustness",
  24: "Constraints generate adaptive solutions",
  25: "Free play built the greats — protect it",
  26: "Mastery is priced in unglamorous repetition",
  27: "Intensity is a learned habit, not a personality",
  28: "The mind trains too",
  29: "Set problems, not solutions",
  30: "Read the game yourself — silence before instruction",
  31: "Creativity is built, not commanded",
  32: "Failure is data",
  33: "Adversity calibrates",
  34: "Teach the player how to learn",
  35: "The player is the protagonist",
  36: "Self-assessment is a skill",
  37: "Mental resilience is trainable",
  38: "Confidence is built from evidence, not affirmation",
  39: "Compare to last week, not to peers",
  40: "Compete daily with yourself, weekly with peers, occasionally with the best",
  41: "Coachability is a multiplier",
  42: "Pressure breaks the player you're trying to build — and coping is taught",
};

/** The frozen v1.0.1 identifier set — 1..42. */
export const CONVICTION_IDS: readonly number[] = Object.keys(CONVICTION_TITLES).map(Number);

export function isValidConvictionId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id in CONVICTION_TITLES;
}
