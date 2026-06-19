'use client';

import { useEffect, useRef, useState } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Pattern Break — anticipation, pattern recognition, inhibition.
 * A fixed sequence cycles one step at a time on a clock (A→B→C→D→A…). The
 * current element shows large in the centre; recent steps sit faintly as a
 * learnable history. MOST steps follow the pattern; occasional catch-trials
 * BREAK it (the shown element is the wrong next one). Tap "Break!" the moment
 * you detect a deviation. Honest, signal-detection scoring: hits − false alarms.
 * ~28 steps, ~6–8 breaks, none in the first few (let the pattern establish).
 * Capacities: Cognitive + Adaptive.
 */

const STEPS = 28;
const ESTABLISH = 5; // no breaks before this step index
const BEST_KEY = 'stunprex_patternbreak_best';

// Distinguishable tiles — letter + brand-derived colour, used as the alphabet.
const TILES = [
  { id: 'A', color: '#FA961C' }, // orange
  { id: 'B', color: '#107099' }, // deep blue
  { id: 'C', color: '#3FA796' }, // mint-green
  { id: 'D', color: '#C0560C' }, // burnt orange
] as const;

type Phase = 'ready' | 'playing' | 'over';

interface Step {
  shownTile: number; // index into TILES that is displayed
  expectedTile: number; // index the pattern predicts for this step
  isBreak: boolean; // shownTile !== expectedTile
  cadenceMs: number; // how long this step stays on screen
}

interface Stats {
  hits: number;
  misses: number;
  falseAlarms: number;
  breaks: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** XOR-shift32 seeded RNG — reproducible per round. */
function rng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Build the full step list for one round.
 * - The base pattern is a rotating cycle of `patternLen` tiles (3 early, 4 late).
 * - We schedule ~6–8 break steps, none before ESTABLISH, weighted slightly later.
 * - Late breaks are subtle (near-neighbour wrong tile); early breaks are obvious.
 * - Cadence speeds up over the round.
 */
function buildRound(seed: number): { steps: Step[]; breaks: number } {
  const r = rng(seed);

  // How many breaks this round: 6–8.
  const breakCount = 6 + Math.floor(r() * 3); // 6,7,8

  // Choose break positions in [ESTABLISH, STEPS-1], no two adjacent, later-weighted.
  const breakAt = new Set<number>();
  let guard = 0;
  while (breakAt.size < breakCount && guard < 500) {
    guard++;
    // bias toward later steps: square the uniform draw
    const u = r();
    const pos = Math.floor(ESTABLISH + u * u * (STEPS - ESTABLISH - 1));
    if (breakAt.has(pos) || breakAt.has(pos - 1) || breakAt.has(pos + 1)) continue;
    breakAt.add(pos);
  }

  const steps: Step[] = [];
  // The "next expected" pointer walks the cycle. A break shows a wrong tile but
  // the cycle pointer still advances as if the pattern were followed, so the
  // learnable pattern stays intact for the player.
  let cyclePos = 0;

  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1); // 0..1 difficulty ramp
    const patternLen = t < 0.5 ? 3 : 4; // pattern lengthens late
    const expectedTile = cyclePos % patternLen;

    const isBreak = breakAt.has(i);
    let shownTile = expectedTile;
    if (isBreak) {
      if (t < 0.45) {
        // obvious early break: jump two positions away in the alphabet
        shownTile = (expectedTile + 2) % TILES.length;
      } else {
        // subtle late break: a near-neighbour wrong tile (off by one)
        shownTile = (expectedTile + 1) % TILES.length;
      }
      if (shownTile === expectedTile) shownTile = (expectedTile + 1) % TILES.length;
    }

    // cadence: 1200ms early → 620ms late
    const cadenceMs = Math.round(lerp(1200, 620, t));

    steps.push({ shownTile, expectedTile, isBreak, cadenceMs });
    cyclePos++;
  }

  return { steps, breaks: breakAt.size };
}

export function PatternBreak() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [stepIdx, setStepIdx] = useState(0); // 0-based current step
  const [shownTile, setShownTile] = useState(0); // currently displayed tile
  const [history, setHistory] = useState<number[]>([]); // recent shown tiles (faint)
  const [flash, setFlash] = useState<'hit' | 'false' | null>(null); // momentary feedback
  const [tappedThisStep, setTappedThisStep] = useState(false);
  const [stats, setStats] = useState<Stats>({ hits: 0, misses: 0, falseAlarms: 0, breaks: 0 });
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [takeaway, setTakeaway] = useState('');
  const [score, setScore] = useState(0);

  // ── Mutable game state in refs (no stale-closure issues) ──────────────────
  const stepsRef = useRef<Step[]>([]);
  const idxRef = useRef(0);
  const statsRef = useRef<Stats>({ hits: 0, misses: 0, falseAlarms: 0, breaks: 0 });
  const tappedRef = useRef(false); // tapped during the current step?
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useRef(false);

  // ── Init reduced-motion + best, cleanup on unmount ─────────────────────────
  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isAuthed) {
      try {
        const v = window.localStorage.getItem(BEST_KEY);
        if (v) setBest(Number(v));
      } catch {
        /* ignore */
      }
    }
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, [isAuthed]);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  // Stable ref so a scheduled timeout always calls the latest version.
  const advanceRef = useRef<(idx: number) => void>(() => {});

  const finish = () => {
    clearTimers();
    const s = statsRef.current;
    const sc = Math.max(0, s.hits - s.falseAlarms);
    setScore(sc);
    setStats({ ...s });
    setTakeaway(
      buildTakeaway(s),
    );
    setPhase('over');
    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (sc > prev) {
          window.localStorage.setItem(BEST_KEY, String(sc));
          setBest(sc);
          setIsNewBest(true);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const advance = (idx: number) => {
    clearTimers();

    // Resolve the step we are LEAVING (idx-1): a break left without a tap is a MISS.
    if (idx > 0) {
      const prev = stepsRef.current[idx - 1];
      if (prev.isBreak && !tappedRef.current) {
        statsRef.current.misses += 1;
      }
    }

    if (idx >= STEPS) {
      finish();
      return;
    }

    const step = stepsRef.current[idx];
    idxRef.current = idx;
    tappedRef.current = false;
    setTappedThisStep(false);
    setStepIdx(idx);
    setShownTile(step.shownTile);
    setHistory((h) => {
      if (idx === 0) return [];
      const prevTile = stepsRef.current[idx - 1].shownTile;
      return [...h, prevTile].slice(-4);
    });

    // Schedule the next step at this step's cadence.
    timerRefs.current.push(
      setTimeout(() => advanceRef.current(idx + 1), step.cadenceMs),
    );
  };
  advanceRef.current = advance;

  const handleBreakTap = () => {
    if (phase !== 'playing') return;
    if (tappedRef.current) return; // one decision per step
    tappedRef.current = true;
    setTappedThisStep(true);

    const step = stepsRef.current[idxRef.current];
    if (step.isBreak) {
      statsRef.current.hits += 1;
      flashFeedback('hit');
    } else {
      statsRef.current.falseAlarms += 1;
      flashFeedback('false');
    }
    // mirror running tally to HUD
    setStats({ ...statsRef.current });
    setScore(Math.max(0, statsRef.current.hits - statsRef.current.falseAlarms));
  };

  const flashFeedback = (kind: 'hit' | 'false') => {
    if (reducedMotion.current) {
      // keep it static but still readable — show, then clear without transition
      setFlash(kind);
      timerRefs.current.push(setTimeout(() => setFlash(null), 260));
      return;
    }
    setFlash(kind);
    timerRefs.current.push(setTimeout(() => setFlash(null), 300));
  };

  const start = () => {
    clearTimers();
    const seed = Date.now() & 0x7fffffff;
    const { steps, breaks } = buildRound(seed);
    stepsRef.current = steps;
    idxRef.current = 0;
    tappedRef.current = false;
    statsRef.current = { hits: 0, misses: 0, falseAlarms: 0, breaks };
    setStats({ hits: 0, misses: 0, falseAlarms: 0, breaks });
    setScore(0);
    setIsNewBest(false);
    setFlash(null);
    setHistory([]);
    setPhase('playing');
    advanceRef.current(0);
  };

  const currentStep = stepsRef.current[idxRef.current];
  const tile = TILES[shownTile] ?? TILES[0];

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>
          Step {Math.min(stepIdx + (phase === 'playing' ? 1 : 0), STEPS)}/{STEPS}
        </span>
        {phase === 'playing' && (
          <span>
            Score {score} · {stats.hits} caught
          </span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best: {best}</span>}
      </div>

      {/* Play area */}
      <div
        className="relative touch-none select-none overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: '16/9' }}
      >
        {/* ── PLAYING ── */}
        {phase === 'playing' && currentStep && (
          <div className="absolute inset-0 flex flex-col items-center justify-between p-4">
            {/* History strip (faint, learnable) */}
            <div className="flex h-12 w-full items-center justify-center gap-2">
              {history.length === 0 ? (
                <span className="font-ui text-[10px] uppercase tracking-widest text-brown/30">
                  watching the pattern…
                </span>
              ) : (
                history.map((h, i) => {
                  const ht = TILES[h];
                  const opacity = 0.18 + (i / Math.max(1, history.length - 1)) * 0.32;
                  return (
                    <div
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-md font-ui text-sm font-bold text-white"
                      style={{ backgroundColor: ht.color, opacity }}
                    >
                      {ht.id}
                    </div>
                  );
                })
              )}
            </div>

            {/* Current element — large, centred */}
            <div className="flex flex-1 items-center justify-center">
              <div
                className="flex items-center justify-center rounded-2xl font-heading text-white shadow-lg"
                style={{
                  width: 'min(34vw, 150px)',
                  height: 'min(34vw, 150px)',
                  fontSize: 'min(16vw, 72px)',
                  backgroundColor: tile.color,
                  outline:
                    flash === 'hit'
                      ? '4px solid #107099'
                      : flash === 'false'
                        ? '4px solid #DC2626'
                        : '4px solid transparent',
                  transition: reducedMotion.current ? 'none' : 'outline-color 120ms linear',
                }}
              >
                {tile.id}
              </div>
            </div>

            {/* Break button + momentary feedback line */}
            <div className="flex w-full flex-col items-center gap-1.5">
              <div className="h-4 font-ui text-xs">
                {flash === 'hit' && <span className="text-deepblue">Break caught</span>}
                {flash === 'false' && (
                  <span className="text-[#DC2626]">That one followed the pattern</span>
                )}
                {flash === null && tappedThisStep && (
                  <span className="text-brown/40">called this step</span>
                )}
              </div>
              <button
                type="button"
                onPointerDown={handleBreakTap}
                disabled={tappedThisStep}
                className="min-h-[44px] min-w-[160px] rounded-full bg-orange px-8 py-2.5 font-ui text-lg font-bold text-white shadow transition-opacity disabled:opacity-40"
              >
                Break!
              </button>
            </div>
          </div>
        )}

        {/* ── READY overlay ── */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Pattern Break</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              A fixed sequence of tiles cycles one step at a time. Learn the order from the
              faint history. Most steps follow it — but a few <em>break</em> the pattern and
              show the wrong tile. Tap <strong>Break!</strong> the instant you spot a
              deviation. Wait for the real one — calling it early counts against you.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — {STEPS} steps
            </button>
          </div>
        )}

        {/* ── OVER overlay ── */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">{score}</p>
            <p className="font-ui text-xs uppercase tracking-widest text-brown/50">
              hits − false alarms
            </p>

            {/* Raw signal-detection counts */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-ui text-sm text-brown/80">
              <span>
                <strong className="text-deepblue">{stats.hits}</strong> hits
              </span>
              <span>
                <strong className="text-[#DC2626]">{stats.misses}</strong> misses
              </span>
              <span>
                <strong className="text-[#DC2626]">{stats.falseAlarms}</strong> false alarms
              </span>
            </div>
            <p className="mt-1 font-ui text-xs text-brown/60">
              Hit rate {hitRate(stats)}% of {stats.breaks} breaks · {stats.falseAlarms} false
              {stats.falseAlarms === 1 ? ' call' : ' calls'}
            </p>

            <p className="mt-3 max-w-xs font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} />
            </div>
            <button onClick={start} className="btn-primary mt-4">
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function hitRate(s: Stats): number {
  return s.breaks > 0 ? Math.round((s.hits / s.breaks) * 100) : 0;
}

/**
 * d′-like sensitivity comment: weighs catching breaks against over-calling.
 * Never a grade, never shaming — points at the behaviour.
 */
function buildTakeaway(s: Stats): string {
  const hr = s.breaks > 0 ? s.hits / s.breaks : 0;
  if (s.falseAlarms >= 4) {
    return 'You called break too often — wait for the real deviation, not the expectation of one.';
  }
  if (hr >= 0.7 && s.falseAlarms <= 1) {
    return 'Sharp sensitivity — you caught the breaks without over-calling.';
  }
  if (hr >= 0.7) {
    return 'You caught most breaks, but a few false calls slipped in — hold until you actually see the wrong tile.';
  }
  if (hr >= 0.4) {
    return 'A solid read on the pattern — anticipate the next tile so a break jumps out the moment it lands.';
  }
  return 'The pattern was there to learn — track the cycle a beat ahead so the wrong tile is obvious.';
}
