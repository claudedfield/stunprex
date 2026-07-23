/**
 * The five custom Vercel Analytics events StunpreX tracks — no more, no fewer.
 * See Q1_Status/StunpreX_Measurement_Baseline_v1.md for the reasoning.
 * Cookieless, no personal data in any property.
 */
import { track } from '@vercel/analytics';

/** A drill page was scrolled past its body AND held for a genuine dwell floor — not either alone. */
export function trackDrillReadComplete(drillId: string) {
  track('drill_read_complete', { drill_id: drillId });
}

/** A /training facet was toggled. Tells us what people came looking for. */
export function trackDrillFilterUsed(dimension: string, value: string) {
  track('drill_filter_used', { dimension, value });
}

/** A game round was played to its end state (the round-over screen rendered). */
export function trackGameCompleted(game: string) {
  track('game_completed', { game });
}

/** The question composer on /community/ask was opened (first interaction, not just page load). */
export function trackCommunityQuestionStarted() {
  track('community_question_started');
}

/** A new user completed onboarding (the "Go to the community" step on /community/welcome). */
export function trackSignupCompleted() {
  track('signup_completed');
}
