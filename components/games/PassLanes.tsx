'use client';

import { useEffect, useRef, useState } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Pass Lanes — decision-making under a closing clock (Cognitive + Perceptual).
 * You hold the ball at bottom-centre. 2–3 teammates wait near the top, each
 * reachable by a vertical lane. A defender sits in each lane and CLOSES it as
 * the rep runs (each lane's openness falls at its own rate). A per-rep timer
 * counts down. Tap the teammate whose lane is MOST OPEN at the moment you
 * choose — the best pass. On tap or timeout, the best lane is revealed, then
 * the next rep begins. ~12 reps; difficulty ramps via t ∈ [0,1].
 */

const REPS = 12;
const REVEAL_MS = 950; // how long the best-lane reveal shows before next rep
const BEST_KEY = 'stunprex_passlanes_best';

type Phase = 'ready' | 'playing' | 'reveal' | 'over';
type Outcome = 'best' | 'worse' | 'slow';

interface Lane {
  /** horizontal centre as a fraction 0–1 of the play width */
  xFrac: number;
  /** current openness 0–1 (1 = wide open, 0 = shut) */
  openness: number;
  /** openness at the start of the rep */
  startOpenness: number;
  /** per-second closing rate */
  closeRate: number;
}

interface RepPlan {
  lanes: Lane[];
  /** countdown window for this rep, ms */
  timeMs: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** XOR-shift32 seeded RNG — reproducible per rep */
function rng(seed: number) {
  let s = (seed ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

/** Build the lanes + timer for one rep at difficulty t. */
function buildRep(globalSeed: number, idx: number, t: number): RepPlan {
  const r = rng(globalSeed * 131 + idx * 1009 + 7);
  const laneCount = t < 0.45 ? 2 : 3;

  // Horizontal slots, evenly spread with a little jitter
  const xs: number[] = [];
  for (let i = 0; i < laneCount; i++) {
    const base = (i + 1) / (laneCount + 1);
    xs.push(base + (r() - 0.5) * 0.06);
  }

  // Closing rates ramp with t; later reps close faster.
  const minRate = lerp(0.12, 0.32, t);
  const maxRate = lerp(0.3, 0.6, t);

  // Start openness: pick a clear-ish best, with the gap to 2nd-best shrinking as t rises.
  const bestStart = lerp(0.92, 0.8, t);
  const gap = lerp(0.26, 0.08, t); // best vs 2nd-best openness gap at start
  const bestLaneIdx = Math.floor(r() * laneCount);

  const lanes: Lane[] = xs.map((xFrac, i) => {
    let start: number;
    if (i === bestLaneIdx) {
      start = bestStart;
    } else {
      // worse lanes sit below the best by at least `gap`, with spread
      start = bestStart - gap - r() * 0.22;
    }
    start = Math.min(0.96, Math.max(0.18, start));
    return {
      xFrac,
      openness: start,
      startOpenness: start,
      closeRate: lerp(minRate, maxRate, r()),
    };
  });

  const timeMs = Math.round(lerp(2500, 1200, t));
  return { lanes, timeMs };
}

/** Index of the most-open lane right now. */
function bestLaneNow(lanes: Lane[]): number {
  let bi = 0;
  for (let i = 1; i < lanes.length; i++) {
    if (lanes[i].openness > lanes[bi].openness) bi = i;
  }
  return bi;
}

export function PassLanes() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [lanesView, setLanesView] = useState<Lane[]>([]);
  const [timePct, setTimePct] = useState(1); // 1 → 0 over the rep window
  const [repDisplay, setRepDisplay] = useState(0); // 1-based for HUD
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [revealBestIdx, setRevealBestIdx] = useState<number | null>(null);
  const [lastOutcome, setLastOutcome] = useState<Outcome | null>(null);

  const [bestPicks, setBestPicks] = useState(0);
  const [worsePicks, setWorsePicks] = useState(0);
  const [slowCount, setSlowCount] = useState(0);

  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [takeaway, setTakeaway] = useState('');
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // ── Mutable game state in refs (no stale-closure issues) ──────────────────
  const repsRef = useRef<RepPlan[]>([]);
  const repIdxRef = useRef(0);
  const lanesRef = useRef<Lane[]>([]);
  const repStartRef = useRef(0);
  const repTimeRef = useRef(0);
  const lastStepRef = useRef(0); // for reduced-motion stepped closure
  const resolvedRef = useRef(false); // guard: this rep already resolved (tap/timeout)
  const rafRef = useRef<number | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useRef(false);

  // Tallies in refs so end-of-round reads the latest without stale closures.
  const bestPicksRef = useRef(0);
  const worsePicksRef = useRef(0);
  const slowRef = useRef(0);
  const speedBonusRef = useRef(0); // accumulated fractional speed bonus

  // Stable ref to beginRep so timeout-chained advances call the latest version.
  const beginRepRef = useRef<(idx: number) => void>(() => {});

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // ── Init + cleanup ────────────────────────────────────────────────────────
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
      clearTimers();
    };
  }, [isAuthed]);

  const finish = () => {
    clearTimers();
    const b = bestPicksRef.current;
    const total = REPS;
    const acc = total > 0 ? Math.round((b / total) * 100) : 0;
    // Honest score: 100 per correct best-lane pick, plus a small speed bonus
    // (quicker correct picks worth a touch more). Worse picks / timeouts add nothing.
    const s = Math.round(b * 100 + speedBonusRef.current);
    setScore(s);
    setAccuracy(acc);
    setBestPicks(b);
    setWorsePicks(worsePicksRef.current);
    setSlowCount(slowRef.current);
    setTakeaway(
      slowRef.current >= 3
        ? 'Several lanes shut before you chose — decide a beat earlier; the best lane rarely stays best.'
        : worsePicksRef.current > b
        ? 'You committed, but often to a tighter lane — scan all lanes before you pick the most open one.'
        : b >= 9
        ? 'Sharp reads — you found the open lane while it was still open. That is the pass.'
        : 'Solid reads. Keep scanning every lane each rep; the openness order changes as defenders close.',
    );
    setPhase('over');
    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (s > prev) {
          window.localStorage.setItem(BEST_KEY, String(s));
          setBest(s);
          setIsNewBest(true);
        }
      } catch {
        /* ignore */
      }
    }
  };

  // Resolve the current rep — either a tap (pickIdx set) or a timeout (pickIdx = null).
  const resolveRep = (pickIdx: number | null) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    clearTimers();

    const lanes = lanesRef.current;
    const bi = bestLaneNow(lanes);
    setRevealBestIdx(bi);
    setPickedIdx(pickIdx);
    setLanesView(lanes.map((l) => ({ ...l }))); // freeze the moment of decision

    let outcome: Outcome;
    if (pickIdx === null) {
      slowRef.current += 1;
      outcome = 'slow';
    } else if (pickIdx === bi) {
      bestPicksRef.current += 1;
      // Speed bonus: more time left on a correct pick = a touch more (0–25 pts).
      const elapsed = performance.now() - repStartRef.current;
      const remainFrac = Math.max(0, 1 - elapsed / repTimeRef.current);
      speedBonusRef.current += remainFrac * 25;
      outcome = 'best';
    } else {
      worsePicksRef.current += 1;
      outcome = 'worse';
    }
    setLastOutcome(outcome);
    setBestPicks(bestPicksRef.current);
    setWorsePicks(worsePicksRef.current);
    setSlowCount(slowRef.current);
    setPhase('reveal');

    const nextIdx = repIdxRef.current + 1;
    timerRefs.current.push(
      setTimeout(() => beginRepRef.current(nextIdx), REVEAL_MS),
    );
  };

  const beginRep = (idx: number) => {
    clearTimers();

    if (idx >= REPS) {
      finish();
      return;
    }

    const rep = repsRef.current[idx];
    repIdxRef.current = idx;
    // Deep-copy lanes so live closure mutates a fresh set each rep.
    lanesRef.current = rep.lanes.map((l) => ({ ...l }));
    repTimeRef.current = rep.timeMs;
    repStartRef.current = performance.now();
    lastStepRef.current = repStartRef.current;
    resolvedRef.current = false;

    setRepDisplay(idx + 1);
    setPickedIdx(null);
    setRevealBestIdx(null);
    setLastOutcome(null);
    setTimePct(1);
    setLanesView(lanesRef.current.map((l) => ({ ...l })));
    setPhase('playing');

    const tick = () => {
      const now = performance.now();
      const elapsed = now - repStartRef.current;
      const frac = Math.min(1, elapsed / repTimeRef.current);
      setTimePct(1 - frac);

      if (reducedMotion.current) {
        // Stepped closure — recompute openness in discrete ~220ms steps, no tween.
        if (now - lastStepRef.current >= 220) {
          const dt = (now - lastStepRef.current) / 1000;
          lastStepRef.current = now;
          for (const l of lanesRef.current) {
            l.openness = Math.max(0, l.openness - l.closeRate * dt);
          }
          setLanesView(lanesRef.current.map((l) => ({ ...l })));
        }
      } else {
        // Smooth closure each frame.
        const dt = (now - lastStepRef.current) / 1000;
        lastStepRef.current = now;
        for (const l of lanesRef.current) {
          l.openness = Math.max(0, l.openness - l.closeRate * dt);
        }
        setLanesView(lanesRef.current.map((l) => ({ ...l })));
      }

      if (elapsed >= repTimeRef.current) {
        resolveRep(null); // too slow — timeout
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  beginRepRef.current = beginRep;

  const start = () => {
    clearTimers();
    bestPicksRef.current = 0;
    worsePicksRef.current = 0;
    slowRef.current = 0;
    speedBonusRef.current = 0;
    repIdxRef.current = 0;
    setBestPicks(0);
    setWorsePicks(0);
    setSlowCount(0);
    setScore(0);
    setAccuracy(0);
    setIsNewBest(false);
    const seed = Date.now() >>> 0;
    repsRef.current = Array.from({ length: REPS }, (_, i) =>
      buildRep(seed, i, REPS > 1 ? i / (REPS - 1) : 0),
    );
    beginRepRef.current(0);
  };

  const onPickLane = (i: number) => {
    if (phase !== 'playing' || resolvedRef.current) return;
    resolveRep(i);
  };

  const done = bestPicks + worsePicks + slowCount;
  const seconds = Math.max(0, (timePct * (repTimeRef.current || 0)) / 1000);

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>
          Rep {Math.min(repDisplay, REPS)}/{REPS}
        </span>
        {(phase === 'playing' || phase === 'reveal') && (
          <span>{bestPicks} best picks</span>
        )}
        {phase === 'playing' && (
          <span className="text-orange">{seconds.toFixed(1)}s</span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best: {best}</span>}
      </div>

      {/* Play area — top-down pitch */}
      <div
        className="relative touch-none select-none overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: '16/11' }}
      >
        {/* Live pitch (playing / reveal) */}
        {(phase === 'playing' || phase === 'reveal') && (
          <>
            {/* Lanes */}
            {lanesView.map((l, i) => {
              const isBest = revealBestIdx === i;
              const isPicked = pickedIdx === i;
              // Openness → colour: open = mint/blue, closing = toward red.
              const open = l.openness;
              const laneFill = `rgba(${lerp(220, 16, open).toFixed(0)}, ${lerp(
                38,
                112,
                open,
              ).toFixed(0)}, ${lerp(38, 153, open).toFixed(0)}, ${(
                0.06 +
                0.14 * open
              ).toFixed(3)})`;
              const defenderTop = `${lerp(58, 26, open)}%`; // defender drops down the lane as it shuts
              const showFlag = phase === 'reveal';

              return (
                <div
                  key={i}
                  className="absolute bottom-0 top-0"
                  style={{
                    left: `${l.xFrac * 100}%`,
                    width: '26%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* lane corridor */}
                  <div
                    className="absolute inset-x-[14%] bottom-[14%] top-[16%] rounded-full"
                    style={{
                      backgroundColor: laneFill,
                      outline:
                        showFlag && isBest
                          ? '2px solid #FA961C'
                          : showFlag && isPicked
                          ? '2px solid #DC2626'
                          : 'none',
                      outlineOffset: '2px',
                      transition: reducedMotion.current
                        ? 'none'
                        : 'background-color 90ms linear',
                    }}
                  />

                  {/* defender (red) sliding into the lane as it closes */}
                  <div
                    className="absolute flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full font-ui text-[9px] font-bold text-white shadow"
                    style={{
                      left: '50%',
                      top: defenderTop,
                      backgroundColor: '#DC2626',
                      opacity: 0.55 + 0.45 * (1 - open),
                      transition: reducedMotion.current
                        ? 'none'
                        : 'top 90ms linear, opacity 90ms linear',
                    }}
                    aria-hidden
                  >
                    D
                  </div>

                  {/* teammate dot (tap target ≥ 36px) near the top of the lane */}
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onPickLane(i);
                    }}
                    disabled={phase !== 'playing'}
                    aria-label={`Pass to teammate in lane ${i + 1}`}
                    className="absolute left-1/2 top-[8%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 font-ui text-[11px] font-bold shadow transition-transform"
                    style={{
                      borderColor:
                        showFlag && isBest
                          ? '#FA961C'
                          : showFlag && isPicked
                          ? '#DC2626'
                          : '#107099',
                      backgroundColor:
                        showFlag && isBest
                          ? '#FA961C'
                          : '#107099',
                      color: '#FFFFFF',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {showFlag && isBest ? '✓' : 'TM'}
                  </button>

                  {/* reveal label */}
                  {showFlag && (isBest || isPicked) && (
                    <span
                      className="absolute left-1/2 top-[1%] -translate-x-1/2 whitespace-nowrap font-ui text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: isBest ? '#FA961C' : '#DC2626' }}
                    >
                      {isBest ? 'best lane' : 'your pick'}
                    </span>
                  )}
                </div>
              );
            })}

            {/* You — ball carrier at bottom centre */}
            <div className="pointer-events-none absolute bottom-[3%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-deepblue/40 bg-deepblue/15">
                <span className="font-ui text-[10px] font-bold text-deepblue">You</span>
              </div>
            </div>

            {/* Per-rep countdown bar */}
            <div className="absolute inset-x-4 bottom-1.5 h-1 rounded-full bg-deepblue/10">
              <div
                className="h-full rounded-full bg-orange"
                style={{
                  width: `${Math.max(0, timePct) * 100}%`,
                  transition: reducedMotion.current ? 'none' : 'width 80ms linear',
                }}
              />
            </div>

            {/* reveal outcome banner */}
            {phase === 'reveal' && lastOutcome && (
              <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
                <span
                  className="rounded-full px-3 py-1 font-ui text-xs font-bold uppercase tracking-wider text-white shadow"
                  style={{
                    backgroundColor:
                      lastOutcome === 'best'
                        ? '#107099'
                        : lastOutcome === 'worse'
                        ? '#DC2626'
                        : '#8A6D3B',
                  }}
                >
                  {lastOutcome === 'best'
                    ? 'Best lane'
                    : lastOutcome === 'worse'
                    ? 'A better lane was open'
                    : 'Too slow — lane shut'}
                </span>
              </div>
            )}
          </>
        )}

        {/* READY overlay */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Pass Lanes</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              You have the ball at the bottom. Each teammate up top sits in a lane, and a
              defender is closing every lane down. Before the timer runs out, tap the
              teammate whose lane is <strong>most open right now</strong> — the best pass.
              The order changes as defenders close, so read all the lanes each rep.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — {REPS} reps
            </button>
          </div>
        )}

        {/* OVER overlay */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">{score}</p>
            <p className="mt-2 font-body text-sm text-brown/85">
              Best-lane picks <strong>{bestPicks}</strong> · worse lane{' '}
              <strong>{worsePicks}</strong> · too slow <strong>{slowCount}</strong>
            </p>
            <p className="mt-1 font-ui text-sm text-brown/70">
              Accuracy {accuracy}% ({bestPicks}/{done || REPS} reps)
            </p>
            <p className="mt-3 max-w-sm font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} game="pass-lanes" />
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
