/**
 * The events StunpreX counts, sent to our own counter (D-WEB-31; lib/metrics/core.ts holds the
 * list the server accepts). See Q1_Status/StunpreX_Measurement_Baseline_v1.md for the reasoning.
 * No cookie, nothing stored on the device, no personal data in any property.
 */
type Message = { t: 'pageview'; p: string; r?: string } | { t: 'event'; e: string; d?: string }

/** A browser that asks not to be measured sends nothing at all. */
function asksNotToBeMeasured(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean }
  return n.doNotTrack === '1' || n.globalPrivacyControl === true
}

export function sendMetric(message: Message) {
  // The server decides whether measuring is on (METRICS_OPEN); off, it stores nothing.
  if (typeof window === 'undefined' || asksNotToBeMeasured()) return
  try {
    const body = JSON.stringify(message)
    // sendBeacon survives the page closing. text/plain keeps it a simple request.
    if (!navigator.sendBeacon?.('/api/m', new Blob([body], { type: 'text/plain' }))) {
      void fetch('/api/m', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'text/plain' } }).catch(() => {})
    }
  } catch {
    // Measuring never breaks a page.
  }
}

const event = (e: string, d?: string) => sendMetric({ t: 'event', e, d })

/** A drill page was scrolled past its body AND held for a genuine dwell floor, not either alone. */
export function trackDrillReadComplete(drillId: string) {
  event('drill_read_complete', drillId)
}

/** A /training facet was toggled. Tells us what people came looking for. Search text is never sent. */
export function trackDrillFilterUsed(dimension: string, value: string) {
  event('drill_filter_used', `${dimension}:${value}`)
}

/** A game round was played to its end state (the round-over screen rendered). */
export function trackGameCompleted(game: string) {
  event('game_completed', game)
}

/** The question composer on /community/ask was opened (first interaction, not just page load). */
export function trackCommunityQuestionStarted() {
  event('community_question_started')
}

/** A new user completed onboarding (the "Go to the community" step on /community/welcome). */
export function trackSignupCompleted() {
  event('signup_completed')
}

/** The newsletter form answered "check your inbox". Which form; never the name or the address. */
export function trackNewsletterSignup(source: string) {
  event('newsletter_signup', source)
}
