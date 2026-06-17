'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Shoulder Check — scanning + peripheral info encoding under time pressure.
 * Markers (teammates=blue, opponents=red) flash briefly at screen edges as
 * the ball approaches. Then a multiple-choice question about what was visible.
 * ~10 reps per round; difficulty ramps via t ∈ [0,1].
 */

const REPS = 10;
const SCAN_DURATION = 3000; // ms — how long the scan window runs
const FEEDBACK_MS = 900; // ms — how long to show correct/wrong before next rep
const BEST_KEY = 'stunprex_shouldercheck_best';

type Side = 'left' | 'right';
type MType = 'teammate' | 'opponent';
type Phase = 'ready' | 'scanning' | 'question' | 'feedback' | 'over';

interface Marker {
  side: Side;
  type: MType;
  yPct: number; // 20–80 %
  showAt: number; // ms from scan start
  duration: number; // ms visible
}

interface Question {
  text: string;
  options: string[];
  correctIdx: number;
}

interface RepData {
  markers: Marker[];
  question: Question;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** XOR-shift32 seeded RNG — reproducible per rep */
function rng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

/** Build 3–4 distinct option values including `correct`. */
function makeOpts(correct: number): [string[], number] {
  const set = new Set<number>([correct]);
  for (const d of [-2, -1, 1, 2]) {
    const v = correct + d;
    if (v >= 0 && set.size < 4) set.add(v);
  }
  // ensure at least 3 options
  for (let i = 0; set.size < 3; i++) set.add(i);
  const sorted = [...set].sort((a, b) => a - b).slice(0, 4);
  return [sorted.map(String), sorted.indexOf(correct)];
}

/** Generate all marker and question data for one rep. */
function buildRep(globalSeed: number, idx: number, t: number): RepData {
  const r = rng(globalSeed * 31 + idx * 997);
  const flashDuration = Math.round(lerp(450, 200, t));
  const count = Math.max(2, Math.round(lerp(2, 4, t)));

  const markers: Marker[] = [];
  let showAt = 400;
  for (let i = 0; i < count; i++) {
    markers.push({
      side: r() < 0.5 ? 'left' : 'right',
      type: r() < 0.5 ? 'teammate' : 'opponent',
      yPct: 20 + r() * 60,
      showAt,
      duration: flashDuration,
    });
    showAt += flashDuration + 260;
  }

  const opps = markers.filter((m) => m.type === 'opponent');
  const tms = markers.filter((m) => m.type === 'teammate');
  const rightOpps = opps.filter((m) => m.side === 'right').length;
  const leftOpps = opps.filter((m) => m.side === 'left').length;

  // Build question pool from what was shown
  const pool: Question[] = [];

  {
    const [opts, correctIdx] = makeOpts(opps.length);
    pool.push({ text: 'How many opponents did you see?', options: opts, correctIdx });
  }
  {
    const [opts, correctIdx] = makeOpts(tms.length);
    pool.push({ text: 'How many teammates did you see?', options: opts, correctIdx });
  }
  if (opps.length > 0) {
    const correctIdx =
      rightOpps > leftOpps ? 1 : leftOpps > rightOpps ? 0 : 2;
    pool.push({
      text: 'Which side had more opponents?',
      options: ['Left', 'Right', 'Equal'],
      correctIdx,
    });
  }

  const question = pool[Math.floor(r() * pool.length)];
  return { markers, question };
}

export function ShoulderCheck() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [activeMarkerIdx, setActiveMarkerIdx] = useState<number | null>(null);
  const [scanPct, setScanPct] = useState(0);
  // Store only what the render needs — question is read from ref at render time
  const [questionView, setQuestionView] = useState<Question | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [feedbackAnswer, setFeedbackAnswer] = useState('');
  const [repDisplay, setRepDisplay] = useState(0); // 1-based for HUD
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [takeaway, setTakeaway] = useState('');

  // ── Mutable game state in refs (no stale-closure issues) ──────────────────
  const repsRef = useRef<RepData[]>([]);
  const repIdxRef = useRef(0);
  const resultsRef = useRef<boolean[]>([]);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);
  const scanStartRef = useRef(0);
  const reducedMotion = useRef(false);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isAuthed) {
      try {
        const v = window.localStorage.getItem(BEST_KEY);
        if (v) setBest(Number(v));
      } catch { /* ignore */ }
    }
    return () => {
      timerRefs.current.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAuthed]);

  // Stable ref to beginRep so the timeout → beginRep(idx+1) always calls the latest version
  const beginRepRef = useRef<(idx: number) => void>(() => {});

  const beginRep = (idx: number) => {
    // clear any previous timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    if (idx >= REPS) {
      // Compute final state
      const results = resultsRef.current;
      const s = results.filter(Boolean).length;
      const acc = results.length > 0 ? Math.round((s / results.length) * 100) : 0;
      setScore(s);
      setAccuracy(acc);
      setTakeaway(
        s >= 8
          ? 'Strong scanning — you encoded the margins clearly.'
          : s >= 5
          ? 'Decent scan — try to hold each marker a moment longer before the next appears.'
          : 'The information was there — keep the habit of scanning before the ball arrives.',
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
        } catch { /* ignore */ }
      }
      return;
    }

    const rep = repsRef.current[idx];
    repIdxRef.current = idx;
    setRepDisplay(idx + 1);
    setActiveMarkerIdx(null);
    setScanPct(0);
    setWasCorrect(null);
    setPhase('scanning');

    scanStartRef.current = performance.now();

    // RAF for progress bar
    const tick = () => {
      const elapsed = performance.now() - scanStartRef.current;
      setScanPct(Math.min(1, elapsed / SCAN_DURATION));
      if (elapsed < SCAN_DURATION + 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Schedule each marker's show / hide
    for (let i = 0; i < rep.markers.length; i++) {
      const m = rep.markers[i];
      timerRefs.current.push(
        setTimeout(() => setActiveMarkerIdx(i), m.showAt),
        setTimeout(() => setActiveMarkerIdx(null), m.showAt + m.duration),
      );
    }

    // End scan → show question
    const last = rep.markers[rep.markers.length - 1];
    const endAt = Math.max(SCAN_DURATION, last.showAt + last.duration + 350);
    timerRefs.current.push(
      setTimeout(() => {
        setActiveMarkerIdx(null);
        setQuestionView(rep.question);
        setPhase('question');
      }, endAt),
    );
  };
  beginRepRef.current = beginRep;

  const handleAnswer = (optIdx: number) => {
    const rep = repsRef.current[repIdxRef.current];
    const correct = optIdx === rep.question.correctIdx;
    resultsRef.current.push(correct);
    setWasCorrect(correct);
    setFeedbackAnswer(rep.question.options[rep.question.correctIdx]);
    // Update live score display
    const s = resultsRef.current.filter(Boolean).length;
    const total = resultsRef.current.length;
    setScore(s);
    setAccuracy(Math.round((s / total) * 100));
    setPhase('feedback');

    // Advance after feedback pause
    const nextIdx = repIdxRef.current + 1;
    timerRefs.current.push(
      setTimeout(() => beginRepRef.current(nextIdx), FEEDBACK_MS),
    );
  };

  const start = () => {
    resultsRef.current = [];
    repIdxRef.current = 0;
    setScore(0);
    setAccuracy(0);
    setIsNewBest(false);
    const seed = Date.now();
    repsRef.current = Array.from({ length: REPS }, (_, i) =>
      buildRep(seed, i, i / (REPS - 1)),
    );
    beginRepRef.current(0);
  };

  // Convenience: current rep data for the render
  const currentRep = repsRef.current[repIdxRef.current];

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>Rep {Math.min(repDisplay, REPS)}/{REPS}</span>
        {phase !== 'ready' && phase !== 'over' && (
          <span>{score}/{resultsRef.current.length} correct</span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best: {best}/{REPS}</span>}
      </div>

      {/* Play area — relative container, fixed 16:9 */}
      <div
        className="relative overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: '16/9' }}
      >
        {/* ── SCANNING PHASE ── */}
        {phase === 'scanning' && currentRep && (
          <>
            {/* "You" indicator at centre */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-deepblue/40 bg-deepblue/15">
                  <span className="font-ui text-[11px] font-bold text-deepblue">You</span>
                </div>
                <span className="font-ui text-xs uppercase tracking-widest text-brown/50">
                  Ball coming…
                </span>
              </div>
            </div>

            {/* Scan progress bar */}
            <div className="absolute bottom-2 left-4 right-4 h-1 rounded-full bg-deepblue/10">
              <div
                className="h-full rounded-full bg-orange"
                style={{
                  width: `${scanPct * 100}%`,
                  transition: reducedMotion.current ? 'none' : 'width 80ms linear',
                }}
              />
            </div>

            {/* Active marker */}
            {activeMarkerIdx !== null &&
              currentRep.markers[activeMarkerIdx] &&
              (() => {
                const m = currentRep.markers[activeMarkerIdx];
                const bg = m.type === 'opponent' ? '#DC2626' : '#107099';
                const lbl = m.type === 'opponent' ? 'OPP' : 'TM';
                return (
                  <div
                    className="pointer-events-none absolute flex flex-col items-center gap-0.5"
                    style={{
                      top: `${m.yPct}%`,
                      ...(m.side === 'left' ? { left: '3%' } : { right: '3%' }),
                      transform: 'translateY(-50%)',
                    }}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full font-ui text-xs font-bold text-white shadow"
                      style={{ backgroundColor: bg }}
                    >
                      {lbl}
                    </div>
                    <span
                      className="font-ui text-[9px] uppercase tracking-widest"
                      style={{ color: bg }}
                    >
                      {m.side}
                    </span>
                  </div>
                );
              })()}
          </>
        )}

        {/* ── READY overlay ── */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Shoulder Check</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              Markers flash at the edges as the ball approaches — then you answer a question
              about what you saw. Blue&nbsp;=&nbsp;teammate · Red&nbsp;=&nbsp;opponent.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — {REPS} reps
            </button>
          </div>
        )}

        {/* ── QUESTION overlay ── */}
        {phase === 'question' && questionView && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6">
            <p className="mb-3 font-ui text-sm uppercase tracking-widest text-orange">
              Ball arrived
            </p>
            <p className="mb-6 max-w-xs text-center font-body text-lg leading-snug text-deepblue">
              {questionView.text}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {questionView.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="min-w-[72px] rounded-lg border border-deepblue/30 bg-white px-5 py-3 font-ui text-base text-deepblue transition-colors hover:border-orange hover:text-orange"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FEEDBACK overlay ── */}
        {phase === 'feedback' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <p
              className={`font-heading text-2xl ${
                wasCorrect ? 'text-deepblue' : 'text-[#DC2626]'
              }`}
            >
              {wasCorrect ? 'Correct' : 'Missed'}
            </p>
            {!wasCorrect && (
              <p className="mt-1 font-body text-sm text-brown/70">
                Answer: {feedbackAnswer}
              </p>
            )}
            <p className="mt-2 font-ui text-xs text-brown/50">
              {score}/{resultsRef.current.length} correct so far
            </p>
          </div>
        )}

        {/* ── OVER overlay ── */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">
              {score}
              <span className="text-2xl text-deepblue/60">/{REPS}</span>
            </p>
            <p className="mt-1 font-ui text-sm text-brown/70">Accuracy {accuracy}%</p>
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
