'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Switch the Play — cognitive flexibility (task switching) with a switch-cost read-out.
 * A token appears in the centre carrying TWO attributes: a colour and a direction (arrow).
 * A rule banner says which attribute to route by. Tap the matching corner target.
 *  - Rule "By COLOUR": tap the target whose colour matches the token.
 *  - Rule "By DIRECTION": tap the target the arrow points to.
 * The rule holds for a few trials then SWITCHES (announced). Congruent trials (both rules
 * agree) are mixed with incongruent ones (the rules disagree) so the rule actually matters.
 * Honest score surfaces the switch-cost: avg RT on switch trials minus repeat trials.
 * ~24 discrete trials; difficulty ramps via t ∈ [0,1] (more switches + incongruence later).
 *
 * Capacities echoed: Adaptive + Cognitive — the rule and the route change, and you adjust
 * on the spot. The lag after a switch is the adapt tax, and it shrinks with reps.
 */

const TRIALS = 24;
const FEEDBACK_MS = 650; // ms — show correct/wrong before the next trial
const SWITCH_FLASH_MS = 900; // ms — how long the "RULE SWITCHED" banner pulses on a switch trial
const BEST_KEY = 'stunprex_switchtheplay_best';

type Rule = 'colour' | 'direction';
type Phase = 'ready' | 'cue' | 'trial' | 'feedback' | 'over';

// Four corner targets — each owns a fixed colour and a fixed direction.
type Corner = 'tl' | 'tr' | 'bl' | 'br';

interface TargetDef {
  corner: Corner;
  colourName: string;
  colour: string;
  direction: Corner; // the direction an arrow pointing here represents
  arrow: string; // glyph shown on the token when this is the direction answer
  label: string; // short word for feedback
}

// Distinct, brand-adjacent colours; one per corner.
const TARGETS: TargetDef[] = [
  { corner: 'tl', colourName: 'blue', colour: '#107099', direction: 'tl', arrow: '↖', label: 'top-left' },
  { corner: 'tr', colourName: 'orange', colour: '#FA961C', direction: 'tr', arrow: '↗', label: 'top-right' },
  { corner: 'bl', colourName: 'green', colour: '#2F9E6B', direction: 'bl', arrow: '↙', label: 'bottom-left' },
  { corner: 'br', colourName: 'red', colour: '#DC2626', direction: 'br', arrow: '↘', label: 'bottom-right' },
];

const CORNER_POS: Record<Corner, string> = {
  tl: 'top-3 left-3',
  tr: 'top-3 right-3',
  bl: 'bottom-3 left-3',
  br: 'bottom-3 right-3',
};

interface Trial {
  rule: Rule;
  tokenColourCorner: Corner; // which target's colour the token wears
  tokenDirCorner: Corner; // which target the token's arrow points to
  isSwitch: boolean; // first trial after a rule change
  isIncongruent: boolean; // the two rules point to different targets
  correctCorner: Corner; // routed by the active rule
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** XOR-shift32 seeded RNG — reproducible per round */
function rng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

function targetOf(corner: Corner): TargetDef {
  return TARGETS.find((tg) => tg.corner === corner) as TargetDef;
}

/**
 * Build the full trial schedule. Rules run in blocks; block length shortens over the round
 * (more switches later). Incongruent share rises over the round.
 */
function buildTrials(seed: number): Trial[] {
  const r = rng(seed);
  const out: Trial[] = [];
  let rule: Rule = r() < 0.5 ? 'colour' : 'direction';
  let prevRule: Rule | null = null;
  let blockLeft = 0;

  for (let i = 0; i < TRIALS; i++) {
    const t = i / (TRIALS - 1); // 0 → 1

    if (blockLeft <= 0) {
      // open a new block; length 2–4 early, 1–2 late
      const minLen = Math.round(lerp(3, 1, t));
      const maxLen = Math.round(lerp(4, 2, t));
      blockLeft = minLen + Math.floor(r() * (maxLen - minLen + 1));
      // flip the rule for the new block (always a real switch except the very first block)
      if (prevRule !== null) rule = rule === 'colour' ? 'direction' : 'colour';
    }

    const isSwitch = prevRule !== null && rule !== prevRule;

    // incongruence probability ramps from ~0.35 to ~0.75
    const wantIncongruent = r() < lerp(0.35, 0.75, t);

    const colourCorner = TARGETS[Math.floor(r() * 4)].corner;
    let dirCorner: Corner;
    if (wantIncongruent) {
      // pick a different corner for the direction
      const others = TARGETS.filter((tg) => tg.corner !== colourCorner);
      dirCorner = others[Math.floor(r() * others.length)].corner;
    } else {
      dirCorner = colourCorner;
    }

    const isIncongruent = dirCorner !== colourCorner;
    const correctCorner = rule === 'colour' ? colourCorner : dirCorner;

    out.push({
      rule,
      tokenColourCorner: colourCorner,
      tokenDirCorner: dirCorner,
      isSwitch,
      isIncongruent,
      correctCorner,
    });

    prevRule = rule;
    blockLeft -= 1;
  }
  return out;
}

export function SwitchThePlay() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [trialView, setTrialView] = useState<Trial | null>(null);
  const [trialDisplay, setTrialDisplay] = useState(0); // 1-based for HUD
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [pickedCorner, setPickedCorner] = useState<Corner | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [showSwitchFlash, setShowSwitchFlash] = useState(false);

  // over-screen stats
  const [accuracy, setAccuracy] = useState(0);
  const [avgRt, setAvgRt] = useState(0);
  const [switchCost, setSwitchCost] = useState(0);
  const [takeaway, setTakeaway] = useState('');
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // ── Mutable game state in refs (no stale-closure issues) ──────────────────
  const trialsRef = useRef<Trial[]>([]);
  const idxRef = useRef(0);
  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const switchRtRef = useRef<number[]>([]); // RTs of correct switch trials
  const repeatRtRef = useRef<number[]>([]); // RTs of correct repeat trials
  const allRtRef = useRef<number[]>([]); // RTs of all correct trials
  const trialStartRef = useRef(0);
  const lockedRef = useRef(false); // prevents double-taps within a trial
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useRef(false);

  // ── Mount: reduced-motion probe + best (authed only) + cleanup ─────────────
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

  // Stable ref so a queued timeout always calls the latest beginTrial
  const beginTrialRef = useRef<(idx: number) => void>(() => {});

  const finish = () => {
    const correct = correctRef.current;
    const errors = errorsRef.current;
    const total = correct + errors;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

    const allRt = allRtRef.current;
    const avg = allRt.length > 0 ? Math.round(allRt.reduce((a, b) => a + b, 0) / allRt.length) : 0;

    const sw = switchRtRef.current;
    const rp = repeatRtRef.current;
    const swAvg = sw.length > 0 ? sw.reduce((a, b) => a + b, 0) / sw.length : 0;
    const rpAvg = rp.length > 0 ? rp.reduce((a, b) => a + b, 0) / rp.length : 0;
    // switch-cost only meaningful when we have both samples
    const cost = sw.length > 0 && rp.length > 0 ? Math.round(swAvg - rpAvg) : 0;

    setCorrectCount(correct);
    setErrorCount(errors);
    setAccuracy(acc);
    setAvgRt(avg);
    setSwitchCost(cost);

    let line: string;
    if (acc < 60) {
      line = 'The rule kept moving and the routes slipped — slow down and read the banner first; the matching gets cleaner with reps.';
    } else if (sw.length === 0 || rp.length === 0) {
      line = 'Clean routing. Play again for a longer read on how switches land for you.';
    } else if (cost <= 80) {
      line = 'You adapted fast — a small switch-cost. The rule changed and you barely slowed.';
    } else {
      line = `The switches cost you about ${cost}ms — that lag is the adapt tax, and it shrinks with reps.`;
    }
    setTakeaway(line);

    // Honest score: accuracy-weighted volume, then trimmed by the switch-cost lag.
    // correct routes are the base; a heavy switch-cost docks a little so volume alone can't win.
    const base = correct;
    const penalty = cost > 0 ? Math.min(correct, Math.round(cost / 120)) : 0;
    const finalScore = Math.max(0, base - penalty);

    setPhase('over');
    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (finalScore > prev) {
          window.localStorage.setItem(BEST_KEY, String(finalScore));
          setBest(finalScore);
          setIsNewBest(true);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const beginTrial = (idx: number) => {
    clearTimers();

    if (idx >= TRIALS) {
      finish();
      return;
    }

    const trial = trialsRef.current[idx];
    idxRef.current = idx;
    lockedRef.current = false;
    setTrialDisplay(idx + 1);
    setTrialView(trial);
    setWasCorrect(null);
    setPickedCorner(null);
    setShowSwitchFlash(false);

    // A switch trial gets a brief "RULE SWITCHED" cue phase before it goes live.
    if (trial.isSwitch) {
      setPhase('cue');
      setShowSwitchFlash(true);
      timerRefs.current.push(
        setTimeout(() => {
          setShowSwitchFlash(false);
          trialStartRef.current = performance.now();
          setPhase('trial');
        }, SWITCH_FLASH_MS),
      );
    } else {
      trialStartRef.current = performance.now();
      setPhase('trial');
    }
  };
  beginTrialRef.current = beginTrial;

  const handlePick = (corner: Corner) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    const rt = performance.now() - trialStartRef.current;
    const trial = trialsRef.current[idxRef.current];
    const correct = corner === trial.correctCorner;

    setPickedCorner(corner);
    setWasCorrect(correct);

    if (correct) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
      allRtRef.current.push(rt);
      // Only categorise switch-cost on correct trials (clean RT signal).
      if (trial.isSwitch) switchRtRef.current.push(rt);
      else repeatRtRef.current.push(rt);
    } else {
      errorsRef.current += 1;
      setErrorCount(errorsRef.current);
    }

    setPhase('feedback');
    const nextIdx = idxRef.current + 1;
    timerRefs.current.push(setTimeout(() => beginTrialRef.current(nextIdx), FEEDBACK_MS));
  };

  const start = () => {
    clearTimers();
    correctRef.current = 0;
    errorsRef.current = 0;
    switchRtRef.current = [];
    repeatRtRef.current = [];
    allRtRef.current = [];
    setCorrectCount(0);
    setErrorCount(0);
    setIsNewBest(false);
    const seed = Date.now();
    trialsRef.current = buildTrials(seed);
    beginTrialRef.current(0);
  };

  const liveTrial = trialView;
  const ruleLabel = liveTrial?.rule === 'colour' ? 'By COLOUR' : 'By DIRECTION';
  const ruleHint =
    liveTrial?.rule === 'colour'
      ? 'tap the matching colour'
      : 'tap where the arrow points';
  const tokenColour = liveTrial ? targetOf(liveTrial.tokenColourCorner).colour : '#107099';
  const tokenArrow = liveTrial ? targetOf(liveTrial.tokenDirCorner).arrow : '';

  const showPlay = phase === 'cue' || phase === 'trial' || phase === 'feedback';

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>
          Trial {Math.min(trialDisplay, TRIALS)}/{TRIALS}
        </span>
        {phase !== 'ready' && phase !== 'over' && (
          <span>{correctCount} correct</span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best: {best}</span>}
      </div>

      {/* Play area */}
      <div
        className="relative touch-none select-none overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: '16/9' }}
      >
        {/* ── PLAY: rule banner + corner targets + centre token ── */}
        {showPlay && liveTrial && (
          <>
            {/* Rule banner */}
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 text-center">
              <div
                className="rounded-full px-4 py-1 font-ui text-sm font-bold tracking-wide text-white shadow"
                style={{
                  backgroundColor: liveTrial.rule === 'colour' ? '#107099' : '#FA961C',
                }}
              >
                {ruleLabel}
              </div>
              <p className="mt-1 font-ui text-[11px] uppercase tracking-widest text-brown/55">
                {ruleHint}
              </p>
            </div>

            {/* Corner targets */}
            {TARGETS.map((tg) => {
              const isPicked = pickedCorner === tg.corner;
              const isAnswer = phase === 'feedback' && tg.corner === liveTrial.correctCorner;
              const ring =
                phase === 'feedback'
                  ? isAnswer
                    ? 'ring-4 ring-offset-1 ring-[#107099]'
                    : isPicked
                    ? 'ring-4 ring-offset-1 ring-[#DC2626]'
                    : ''
                  : '';
              return (
                <button
                  key={tg.corner}
                  type="button"
                  aria-label={`Target ${tg.colourName} ${tg.label}`}
                  disabled={phase !== 'trial'}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (phase === 'trial') handlePick(tg.corner);
                  }}
                  className={`absolute ${CORNER_POS[tg.corner]} flex h-[clamp(44px,11vw,64px)] w-[clamp(44px,11vw,64px)] items-center justify-center rounded-xl font-ui text-lg font-bold text-white shadow ${ring}`}
                  style={{
                    backgroundColor: tg.colour,
                    transition: reducedMotion.current ? 'none' : 'box-shadow 120ms ease',
                  }}
                >
                  <span aria-hidden>{tg.arrow}</span>
                </button>
              );
            })}

            {/* Centre token */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {showSwitchFlash ? (
                <div className="text-center">
                  <div
                    className="rounded-lg bg-orange px-5 py-2 font-heading text-xl text-white shadow"
                    style={{
                      animation: reducedMotion.current ? 'none' : undefined,
                    }}
                  >
                    Rule switched
                  </div>
                  <p className="mt-2 font-ui text-sm font-bold text-deepblue">
                    Now route {ruleLabel}
                  </p>
                </div>
              ) : (
                <div
                  className="flex h-[clamp(56px,16vw,84px)] w-[clamp(56px,16vw,84px)] items-center justify-center rounded-full text-white shadow-lg"
                  style={{ backgroundColor: tokenColour }}
                >
                  <span aria-hidden className="text-3xl font-bold leading-none">
                    {tokenArrow}
                  </span>
                </div>
              )}
            </div>

            {/* Feedback word */}
            {phase === 'feedback' && wasCorrect !== null && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
                <span
                  className="font-ui text-sm font-bold uppercase tracking-widest"
                  style={{ color: wasCorrect ? '#107099' : '#DC2626' }}
                >
                  {wasCorrect ? 'Routed' : 'Wrong route'}
                </span>
              </div>
            )}
          </>
        )}

        {/* ── READY overlay ── */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Switch the Play</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              A token appears in the centre with a <b>colour</b> and an <b>arrow</b>. The banner at
              the top tells you which one to route by — tap the matching corner. The rule holds for
              a few trials, then <b>switches</b>. We track how fast you adjust after each switch.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — {TRIALS} trials
            </button>
          </div>
        )}

        {/* ── OVER overlay ── */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>

            <div className="mt-3 flex flex-wrap items-end justify-center gap-x-6 gap-y-1 font-ui">
              <span className="text-brown/70">
                <span className="font-heading text-3xl text-deepblue">{correctCount}</span> correct
              </span>
              <span className="text-brown/70">
                <span className="font-heading text-3xl text-[#DC2626]">{errorCount}</span> errors
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-ui text-sm text-brown/70">
              <span>Accuracy {accuracy}%</span>
              <span>Avg RT {avgRt}ms</span>
              <span>
                Switch-cost{' '}
                <span className="font-bold text-deepblue">
                  {switchCost > 0 ? `+${switchCost}` : switchCost}ms
                </span>
              </span>
            </div>

            <p className="mt-3 max-w-sm font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} game="switch-the-play" />
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
