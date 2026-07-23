'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * The Commit Window — timing and impulse control.
 * A defender approaches on a 1-D track. A green window opens briefly:
 * tap inside it to commit. Too early = failed. Too passive = failed.
 * Some reps include a feint flash (orange) — hold back through it,
 * then commit when the real window opens. 12 reps per round.
 */

const REPS = 12;
const W = 640;
const H = 200;
const INTRO_MS = 900; // ms before approach begins
const FEEDBACK_MS = 950; // ms to show result before next rep
const BEST_KEY = 'stunprex_commitwindow_best';

// Track / player geometry (logical canvas pixels)
const TRACK_X0 = 65;
const TRACK_X1 = 555;
const PLAYER_X = 558;
const PLAYER_W = 14;
const PLAYER_H = 48;
const DEF_W = 12;
const DEF_H = 42;
const TRACK_Y = 100;

type RepResult = 'success' | 'early' | 'passive';
type RepPhase = 'intro' | 'approach' | 'done';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rng(seed: number) {
  let s = (seed ^ 0xbeef1234) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

interface RepConfig {
  approachMs: number;
  windowFrac: number; // where in approach the window opens (0–1)
  windowDuration: number;
  hasFeint: boolean;
  feintFrac: number; // where feint starts (0–1, earlier than window)
  feintDuration: number;
}

function buildRep(idx: number, t: number, rand: () => number): RepConfig {
  const approachMs = Math.round(lerp(2200, 1200, t));
  const windowFrac = 0.68 + rand() * 0.10; // 0.68–0.78
  const windowDuration = Math.round(lerp(680, 290, t));
  // Feints appear more at higher difficulty, not in the very first reps
  const hasFeint = idx >= 2 && rand() < lerp(0.25, 0.55, t);
  const feintFrac = 0.38 + rand() * 0.12;
  const feintDuration = Math.round(lerp(380, 260, t));
  return { approachMs, windowFrac, windowDuration, hasFeint, feintFrac, feintDuration };
}

interface DrawArgs {
  defX: number;
  windowActive: boolean;
  feintActive: boolean;
  result: RepResult | null;
  isIntro: boolean;
}

function drawFrame(ctx: CanvasRenderingContext2D, args: DrawArgs, rep: RepConfig | null) {
  const { defX, windowActive, feintActive, result, isIntro } = args;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#EAF4F2';
  ctx.fillRect(0, 0, W, H);

  // Track line
  ctx.save();
  ctx.strokeStyle = 'rgba(16,112,153,0.18)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(TRACK_X0, TRACK_Y);
  ctx.lineTo(TRACK_X1, TRACK_Y);
  ctx.stroke();
  ctx.restore();

  if (rep) {
    // Feint zone (orange band)
    if (feintActive) {
      const fX = lerp(TRACK_X0, PLAYER_X - PLAYER_W / 2, rep.feintFrac);
      const fW = Math.max(20, (PLAYER_X - PLAYER_W / 2 - TRACK_X0) * 0.08);
      ctx.save();
      ctx.fillStyle = 'rgba(250,150,28,0.22)';
      ctx.fillRect(fX - fW / 2, TRACK_Y - 22, fW, 44);
      ctx.fillStyle = '#FA961C';
      ctx.font = '600 12px ui-sans-serif,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FEINT', fX, TRACK_Y - 27);
      ctx.restore();
    }

    // Window zone (green band)
    if (windowActive) {
      const wX = lerp(TRACK_X0, PLAYER_X - PLAYER_W / 2, rep.windowFrac);
      const wDist = (PLAYER_X - PLAYER_W / 2 - wX);
      const wW = Math.max(20, Math.min(80, wDist * 0.55 + 20));
      ctx.save();
      ctx.fillStyle = 'rgba(34,197,94,0.22)';
      ctx.fillRect(wX, TRACK_Y - 22, wW, 44);
      ctx.fillStyle = '#16a34a';
      ctx.font = '600 12px ui-sans-serif,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COMMIT', wX + wW / 2, TRACK_Y - 27);
      ctx.restore();
    }
  }

  // Player (blue rectangle)
  ctx.save();
  ctx.fillStyle = '#107099';
  ctx.fillRect(PLAYER_X - PLAYER_W / 2, TRACK_Y - PLAYER_H / 2, PLAYER_W, PLAYER_H);
  ctx.restore();

  // Defender (red rectangle)
  ctx.save();
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(defX - DEF_W / 2, TRACK_Y - DEF_H / 2, DEF_W, DEF_H);
  ctx.restore();

  // Status label
  ctx.save();
  ctx.font = '500 14px ui-sans-serif,sans-serif';
  ctx.textAlign = 'center';
  if (result === 'success') {
    ctx.fillStyle = '#16a34a';
    ctx.fillText('Good timing', W / 2, 30);
  } else if (result === 'early') {
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Too early — wait for the window', W / 2, 30);
  } else if (result === 'passive') {
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Too passive — go when the window opens', W / 2, 30);
  } else if (isIntro) {
    ctx.fillStyle = 'rgba(16,112,153,0.55)';
    ctx.fillText('Incoming…', W / 2, 30);
  } else if (feintActive) {
    ctx.fillStyle = '#FA961C';
    ctx.fillText('Hold…', W / 2, 30);
  } else if (windowActive) {
    ctx.fillStyle = '#16a34a';
    ctx.fillText('Now!', W / 2, 30);
  } else {
    ctx.fillStyle = 'rgba(16,112,153,0.4)';
    ctx.fillText('Wait…', W / 2, 30);
  }
  ctx.restore();

  // Labels
  ctx.save();
  ctx.font = '11px ui-sans-serif,sans-serif';
  ctx.fillStyle = 'rgba(107,88,60,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('Defender', TRACK_X0, H - 12);
  ctx.textAlign = 'right';
  ctx.fillText('You', PLAYER_X + 2, H - 12);
  ctx.restore();
}

export function CommitWindow() {
  const { isAuthed } = useGamesAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gamePhase, setGamePhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [repDisplay, setRepDisplay] = useState(1);
  const [lastResult, setLastResult] = useState<RepResult | null>(null);
  const [finalResults, setFinalResults] = useState<RepResult[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // Mutable game state in refs
  const repsRef = useRef<RepConfig[]>([]);
  const repIdxRef = useRef(0);
  const repPhaseRef = useRef<RepPhase>('intro');
  const repStartRef = useRef(0);
  const resultsRef = useRef<RepResult[]>([]);
  const tappedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useRef(false);

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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [isAuthed]);

  // Stable ref for the rep runner so it can call itself recursively without stale closure
  const beginRepRef = useRef<(idx: number) => void>(() => {});

  const handleRepEnd = (result: RepResult) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    resultsRef.current.push(result);
    repPhaseRef.current = 'done';
    setLastResult(result);

    const nextIdx = repIdxRef.current + 1;
    feedbackTimerRef.current = setTimeout(() => {
      beginRepRef.current(nextIdx);
    }, FEEDBACK_MS);
  };

  const beginRep = (idx: number) => {
    if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    if (idx >= REPS) {
      const results = resultsRef.current;
      setFinalResults([...results]);
      setGamePhase('over');
      const successes = results.filter((r) => r === 'success').length;
      if (isAuthed) {
        try {
          const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
          if (successes > prev) {
            window.localStorage.setItem(BEST_KEY, String(successes));
            setBest(successes);
            setIsNewBest(true);
          }
        } catch { /* ignore */ }
      }
      return;
    }

    const rep = repsRef.current[idx];
    repIdxRef.current = idx;
    repPhaseRef.current = 'intro';
    tappedRef.current = false;
    repStartRef.current = performance.now();
    setRepDisplay(idx + 1);
    setLastResult(null);

    const loop = (now: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || repPhaseRef.current === 'done') return;

      const elapsed = now - repStartRef.current;

      if (elapsed < INTRO_MS) {
        drawFrame(ctx, { defX: TRACK_X0, windowActive: false, feintActive: false, result: null, isIntro: true }, rep);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      repPhaseRef.current = 'approach';
      const approachElapsed = elapsed - INTRO_MS;
      const approachFrac = Math.min(1, approachElapsed / rep.approachMs);
      const defX = lerp(TRACK_X0, PLAYER_X - PLAYER_W / 2 - 4, approachFrac);

      const windowOpenMs = rep.approachMs * rep.windowFrac;
      const windowCloseMs = windowOpenMs + rep.windowDuration;
      const feintOpenMs = rep.hasFeint ? rep.approachMs * rep.feintFrac : Infinity;
      const feintCloseMs = rep.hasFeint ? feintOpenMs + rep.feintDuration : -Infinity;

      const windowActive = approachElapsed >= windowOpenMs && approachElapsed < windowCloseMs;
      const feintActive = approachElapsed >= feintOpenMs && approachElapsed < feintCloseMs;

      // Window closed without tap → passive
      if (approachElapsed >= windowCloseMs && !tappedRef.current) {
        drawFrame(ctx, { defX, windowActive: false, feintActive: false, result: 'passive', isIntro: false }, rep);
        handleRepEnd('passive');
        return;
      }

      // Approach fully complete (defender reached player) without tap
      if (approachFrac >= 1 && !tappedRef.current) {
        drawFrame(ctx, { defX: PLAYER_X - PLAYER_W / 2 - 4, windowActive: false, feintActive: false, result: 'passive', isIntro: false }, rep);
        handleRepEnd('passive');
        return;
      }

      drawFrame(ctx, { defX, windowActive, feintActive, result: null, isIntro: false }, rep);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };
  beginRepRef.current = beginRep;

  const handleTap = () => {
    if (gamePhase !== 'playing' || repPhaseRef.current === 'done') return;
    const elapsed = performance.now() - repStartRef.current;
    if (elapsed < INTRO_MS) return; // tap during intro — ignore
    if (tappedRef.current) return;

    tappedRef.current = true;
    const rep = repsRef.current[repIdxRef.current];
    const approachElapsed = elapsed - INTRO_MS;
    const windowOpenMs = rep.approachMs * rep.windowFrac;
    const windowCloseMs = windowOpenMs + rep.windowDuration;
    const inWindow = approachElapsed >= windowOpenMs && approachElapsed < windowCloseMs;
    const result: RepResult = inWindow ? 'success' : 'early';

    // Draw result frame immediately
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      const approachFrac = Math.min(1, approachElapsed / rep.approachMs);
      const defX = lerp(TRACK_X0, PLAYER_X - PLAYER_W / 2 - 4, approachFrac);
      const feintOpenMs = rep.hasFeint ? rep.approachMs * rep.feintFrac : Infinity;
      const feintCloseMs = rep.hasFeint ? feintOpenMs + rep.feintDuration : -Infinity;
      const feintActive = approachElapsed >= feintOpenMs && approachElapsed < feintCloseMs;
      drawFrame(ctx, { defX, windowActive: inWindow, feintActive, result, isIntro: false }, rep);
    }

    handleRepEnd(result);
  };

  const start = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }

    const seed = Date.now();
    const rand = rng(seed);
    repsRef.current = Array.from({ length: REPS }, (_, i) =>
      buildRep(i, i / (REPS - 1), rand),
    );
    repIdxRef.current = 0;
    resultsRef.current = [];
    setFinalResults([]);
    setLastResult(null);
    setIsNewBest(false);
    setGamePhase('playing');

    // Draw initial frame so canvas isn't blank
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      drawFrame(ctx, { defX: TRACK_X0, windowActive: false, feintActive: false, result: null, isIntro: true }, repsRef.current[0]);
    }

    beginRepRef.current(0);
  };

  // Derived values for the over screen
  const successes = finalResults.filter((r) => r === 'success').length;
  const earlyCount = finalResults.filter((r) => r === 'early').length;
  const passiveCount = finalResults.filter((r) => r === 'passive').length;
  const accuracy = finalResults.length > 0 ? Math.round((successes / finalResults.length) * 100) : 0;

  const takeaway =
    earlyCount > passiveCount && earlyCount > 1
      ? `You tend to commit early (${earlyCount}×) — hold back and wait for the window to open.`
      : passiveCount > earlyCount && passiveCount > 1
      ? `You tend to be too passive (${passiveCount}×) — trust your read and commit when the window opens.`
      : successes >= 8
      ? "Clean timing — you're reading the approach well."
      : 'Focus on the exact moment the green zone appears.';

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>Rep {Math.min(repDisplay, REPS)}/{REPS}</span>
        {lastResult && gamePhase === 'playing' && (
          <span
            className={
              lastResult === 'success' ? 'text-[#16a34a]' : 'text-[#DC2626]'
            }
          >
            {lastResult === 'success'
              ? '✓ Good'
              : lastResult === 'early'
              ? '✗ Early'
              : '✗ Passive'}
          </span>
        )}
        <span className="flex-1" />
        {isAuthed && best !== null && <span>Best: {best}/{REPS}</span>}
      </div>

      {/* Canvas wrapper */}
      <div
        className="relative overflow-hidden rounded-lg border border-deepblue/15"
        style={{ aspectRatio: `${W}/${H}` }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={gamePhase === 'playing' ? handleTap : undefined}
          className="block w-full touch-none"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="The Commit Window — tap when the green zone appears"
          role="img"
        />

        {/* Ready overlay */}
        {gamePhase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">The Commit Window</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              A defender approaches. Tap when the green window opens — not before, not after.
              Orange flash means feint: hold back, the real window follows.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Start — {REPS} reps
            </button>
          </div>
        )}

        {/* Over overlay */}
        {gamePhase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">
              {successes}
              <span className="text-2xl text-deepblue/60">/{REPS}</span>
            </p>
            <p className="mt-1 font-ui text-sm text-brown/70">
              Accuracy {accuracy}% · Early {earlyCount} · Passive {passiveCount}
            </p>
            <p className="mt-3 max-w-xs font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} game="commit-window" />
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
