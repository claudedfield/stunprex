/**
 * LEGAL-02.2 (2 Oct 2026): a game's best score lives in page memory only.
 *
 * Until now every game wrote `stunprex_<game>_best` to the browser's local storage without asking.
 * The adviser's review of v6: that should not be running. This store has the two calls the games
 * used, backed by memory: the best score survives moving between games in one visit and is gone on a
 * reload. Nothing is written to the device. (LEGAL-01l later brings a "Remember my best score"
 * choice.)
 *
 * It also removes the keys earlier visits left behind, once per page load, so a returning visitor's
 * browser no longer holds what the Cookie Policy will say we do not keep.
 */
const memory = new Map<string, string>()
let cleared = false

function clearLegacy() {
  if (cleared || typeof window === 'undefined') return
  cleared = true
  try {
    const ls = window.localStorage
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i)
      if (k && /^stunprex_[a-z]+_best$/.test(k)) ls.removeItem(k)
    }
  } catch {
    // Storage blocked or unavailable: nothing was stored, nothing to clear.
  }
}

export const pageBest = {
  getItem(key: string): string | null {
    clearLegacy()
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string): void {
    clearLegacy()
    memory.set(key, value)
  },
}
