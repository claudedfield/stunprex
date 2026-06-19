'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Rondo Recall — spatial working memory under a shrinking view window.
 * Each round, N distinct cells light up as "players" for a short VIEW window,
 * then hide. The player taps the cells where the players were. A fully-correct
 * recall deepens the span (N+1); two failed rounds end the game. Cap N at 8.
 *
 * Echoes the rondo habit of knowing where teammates were without a second
 * glance — Cognitive (working memory) + Perceptual (spatial encoding).
 */

const ROWS = 4;
const COLS = 5;
const CELLS = ROWS * COLS; // 20-cell board
const START_N = 4;
const CAP_N = 8;
const MAX_FAILS = 2;

const PER_PLAYER_MS = 600; // base view time per lit cell at N=START_N
const VIEW_FLOOR_MS = 280; // minimum per-player view time as N grows
const REVEAL_MS = 1100; // feedback window showing correct vs missed
const FAIL_REVEAL_MS = 1500; // slightly longer pause when a round is failed

const BEST_KEY = 'stunprex_rondorecall_best';

type Phase = 'ready' | 'showing' | 'recall' | 'feedback' | 'over';

interface RoundResult {
  n: number;
  correctPlaced: number; // lit cells the player found
  mislocations: number; // taps on non-lit cells
  passed: boolean;
}

/** View window (ms) for a round of span n. Total time the lit set is visible. */
function viewWindowMs(n: number, reduced: boolean): number {
  const per = Math.max(VIEW_FLOOR_MS, Math.round(PER_PLAYER_MS - (n - START_N) * 55));
  // Reduced motion uses a static flash; give a touch more time to read it.
  const total = per * n;
  return reduced ? total + 250 : total;
}

/** Pick `n` distinct cell indices in [0, CELLS). */
function pickCells(n: number): Set<number> {
  const pool = Array.from({ length: CELLS }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return new Set(pool.slice(0, n));
}

export function RondoRecall() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [lit, setLit] = useState<Set<number>>(new Set()); // cells shown during 'showing'
  const [picked, setPicked] = useState<Set<number>>(new Set()); // player's taps during 'recall'
  const [revealLit, setRevealLit] = useState<Set<number>>(new Set()); // truth during 'feedback'
  const [n, setN] = useState(START_N);
  const [roundDisplay, setRoundDisplay] = useState(0); // 1-based for HUD
  const [livesLeft, setLivesLeft] = useState(MAX_FAILS);
  const [lastPassed, setLastPassed] = useState<boolean | null>(null);

  // Over-screen summary
  const [maxSpan, setMaxSpan] = useState(START_N - 1); // largest N fully recalled
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalMis, setTotalMis] = useState(0); // mislocations + misses combined
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [takeaway, setTakeaway] = useState('');

  // ── Mutable game state in refs (no stale-closure issues) ──────────────────
  const litRef = useRef<Set<number>>(new Set());
  const pickedRef = useRef<Set<number>>(new Set());
  const nRef = useRef(START_N);
  const failsRef = useRef(0);
  const roundsRef = useRef<RoundResult[]>([]);
  const maxSpanRef = useRef(START_N - 1);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useRef(false);

  // ── Setup + cleanup on unmount ────────────────────────────────────────────
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

  // Stable ref so a timeout always calls the latest beginRound
  const beginRoundRef = useRef<() => void>(() => {});

  const finish = () => {
    clearTimers();
    const rounds = roundsRef.current;
    const span = maxSpanRef.current;
    const correctSum = rounds.reduce((a, r) => a + r.correctPlaced, 0);
    // Total imperfect placements = mislocations + missed lit cells, across rounds.
    const misSum = rounds.reduce(
      (a, r) => a + r.mislocations + (r.n - r.correctPlaced),
      0,
    );
    setMaxSpan(span);
    setRoundsPlayed(rounds.length);
    setTotalCorrect(correctSum);
    setTotalMis(misSum);
    setTakeaway(
      span >= 7
        ? `Your spatial span held to ${span} — that is map-in-the-head territory; the picture stayed whole as it filled.`
        : span >= 5
        ? `Your span held honestly to ${span}. Most rondo scans live around four to five — you held the shape past that.`
        : span >= START_N
        ? `Your span held to ${span}. That is a clean working-memory snapshot; the next cell is where it gets harder.`
        : `The picture held for a moment — building the habit of reading the whole board at once is the work.`,
    );
    setPhase('over');
    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (span > prev) {
          window.localStorage.setItem(BEST_KEY, String(span));
          setBest(span);
          setIsNewBest(true);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const beginRound = () => {
    clearTimers();
    const roundN = nRef.current;
    const cells = pickCells(roundN);

    litRef.current = cells;
    pickedRef.current = new Set();
    setLit(cells);
    setPicked(new Set());
    setRevealLit(new Set());
    setLastPassed(null);
    setRoundDisplay(roundsRef.current.length + 1);
    setPhase('showing');

    // Hide the lit set after the view window → enter recall.
    const windowMs = viewWindowMs(roundN, reducedMotion.current);
    timerRefs.current.push(
      setTimeout(() => {
        setLit(new Set());
        setPhase('recall');
      }, windowMs),
    );
  };
  beginRoundRef.current = beginRound;

  /** Score the current recall, record it, ramp/fail, then schedule next. */
  const settleRound = () => {
    clearTimers();
    const truth = litRef.current;
    const taps = pickedRef.current;
    const roundN = nRef.current;

    let correctPlaced = 0;
    let mislocations = 0;
    taps.forEach((c) => {
      if (truth.has(c)) correctPlaced += 1;
      else mislocations += 1;
    });
    // Fully correct = found every lit cell and tapped no others.
    const passed = correctPlaced === roundN && mislocations === 0;

    roundsRef.current.push({ n: roundN, correctPlaced, mislocations, passed });
    setRevealLit(new Set(truth));
    setLastPassed(passed);
    setPhase('feedback');

    if (passed) {
      if (roundN > maxSpanRef.current) maxSpanRef.current = roundN;
      // Deepen the span (capped). Lives are not refilled — failures are cumulative.
      nRef.current = Math.min(CAP_N, roundN + 1);
      setN(nRef.current);
    } else {
      failsRef.current += 1;
      setLivesLeft(MAX_FAILS - failsRef.current);
    }

    const ended = failsRef.current >= MAX_FAILS;
    const pause = passed ? REVEAL_MS : FAIL_REVEAL_MS;
    timerRefs.current.push(
      setTimeout(() => {
        if (ended) finish();
        else beginRoundRef.current();
      }, pause),
    );
  };

  const toggleCell = (idx: number) => {
    if (phase !== 'recall') return;
    const taps = pickedRef.current;
    if (taps.has(idx)) taps.delete(idx);
    else taps.add(idx);
    setPicked(new Set(taps));
    // Auto-settle once the player has placed exactly N taps (the obvious commit).
    if (taps.size >= nRef.current) {
      // Defer so the final tap paints before the reveal swaps in.
      timerRefs.current.push(setTimeout(() => settleRound(), 180));
    }
  };

  const start = () => {
    clearTimers();
    roundsRef.current = [];
    failsRef.current = 0;
    nRef.current = START_N;
    maxSpanRef.current = START_N - 1;
    setN(START_N);
    setLivesLeft(MAX_FAILS);
    setIsNewBest(false);
    setMaxSpan(START_N - 1);
    setRoundsPlayed(0);
    setTotalCorrect(0);
    setTotalMis(0);
    beginRoundRef.current();
  };

  const cells = Array.from({ length: CELLS }, (_, i) => i);
  const remainingTaps = Math.max(0, n - picked.size);

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>Round {phase === 'ready' ? '–' : roundDisplay}</span>
        {phase !== 'ready' && phase !== 'over' && <span>Span {n}</span>}
        {phase !== 'ready' && phase !== 'over' && (
          <span>
            {'●'.repeat(livesLeft)}
            <span className="text-brown/25">{'○'.repeat(MAX_FAILS - livesLeft)}</span>
          </span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best span: {best}</span>}
      </div>

      {/* Play area */}
      <div
        className="relative overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2] p-4 touch-none"
        style={{ aspectRatio: '5/4' }}
      >
        {/* Grid (live during showing / recall / feedback) */}
        {phase !== 'ready' && phase !== 'over' && (
          <>
            {/* Prompt line */}
            <div className="mb-2 flex h-6 items-center justify-center font-ui text-xs uppercase tracking-widest">
              {phase === 'showing' && <span className="text-orange">Read the board…</span>}
              {phase === 'recall' && (
                <span className="text-deepblue">
                  Place {n} — {remainingTaps} to go
                </span>
              )}
              {phase === 'feedback' && (
                <span className={lastPassed ? 'text-deepblue' : 'text-[#DC2626]'}>
                  {lastPassed ? 'Recalled' : 'Held to here'}
                </span>
              )}
            </div>

            <div
              className="grid h-[calc(100%-2rem)] w-full gap-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              }}
            >
              {cells.map((idx) => {
                const isLit = phase === 'showing' && lit.has(idx);
                const isPicked = phase === 'recall' && picked.has(idx);

                // Feedback colouring: hit (picked & truth), miss (truth, not picked),
                // wrong (picked, not truth).
                let fb: 'none' | 'hit' | 'miss' | 'wrong' = 'none';
                if (phase === 'feedback') {
                  const truth = revealLit.has(idx);
                  const tapped = pickedRef.current.has(idx);
                  if (truth && tapped) fb = 'hit';
                  else if (truth && !tapped) fb = 'miss';
                  else if (!truth && tapped) fb = 'wrong';
                }

                let bg = 'bg-white border-deepblue/15';
                let inner: string | null = null;
                if (isLit) {
                  bg = 'bg-orange border-orange';
                } else if (isPicked) {
                  bg = 'bg-deepblue border-deepblue';
                } else if (fb === 'hit') {
                  bg = 'bg-deepblue border-deepblue';
                } else if (fb === 'miss') {
                  // The cell the player should have placed — outline it.
                  bg = 'bg-white border-orange';
                  inner = 'miss';
                } else if (fb === 'wrong') {
                  bg = 'bg-white border-[#DC2626]';
                  inner = 'wrong';
                }

                const interactive = phase === 'recall';

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!interactive}
                    onPointerDown={interactive ? () => toggleCell(idx) : undefined}
                    aria-label={`Cell ${idx + 1}`}
                    className={`flex min-h-[36px] items-center justify-center rounded-md border-2 ${bg} ${
                      interactive ? 'cursor-pointer hover:border-deepblue/50' : 'cursor-default'
                    }`}
                    style={{
                      transition: reducedMotion.current ? 'none' : 'background-color 120ms, border-color 120ms',
                    }}
                  >
                    {inner === 'miss' && (
                      <span className="block h-2.5 w-2.5 rounded-full bg-orange" />
                    )}
                    {inner === 'wrong' && (
                      <span className="font-ui text-base font-bold text-[#DC2626]">×</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* READY overlay */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Rondo Recall</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              A handful of cells light up as “players”, then vanish. Tap the cells where they
              were. Get them all and the next round adds one — the view window shrinks as the
              span deepens. Two missed rounds ends it.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — span {START_N}
            </button>
          </div>
        )}

        {/* OVER overlay */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-2 font-ui text-xs uppercase tracking-widest text-brown/50">
              Spatial span reached
            </p>
            <p className="font-heading text-5xl text-deepblue">{maxSpan}</p>

            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 font-ui text-sm text-brown/70">
              <span className="text-right">Max span</span>
              <span className="text-left font-semibold text-deepblue">{maxSpan}</span>
              <span className="text-right">Rounds played</span>
              <span className="text-left font-semibold text-deepblue">{roundsPlayed}</span>
              <span className="text-right">Correct placements</span>
              <span className="text-left font-semibold text-deepblue">{totalCorrect}</span>
              <span className="text-right">Mislocations / misses</span>
              <span className="text-left font-semibold text-deepblue">{totalMis}</span>
            </div>

            <p className="mt-3 font-ui text-sm text-brown/70">
              You held {maxSpan} cell{maxSpan === 1 ? '' : 's'} in mind at once.
            </p>
            <p className="mt-2 max-w-xs font-body text-sm italic text-brown/60">{takeaway}</p>
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
