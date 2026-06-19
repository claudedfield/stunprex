'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Two Things at Once — divided attention. A tracking task and a decision task,
 * run first alone, then together, so the player feels the dual-task cost.
 *
 * PHASE A (single, ~12s): keep the pointer ON the ball as it wanders. Every frame
 * the pointer sits within HIT_RADIUS of the ball counts as on-target. Phase-A
 * tracking % is the clean baseline.
 *
 * PHASE B (both, ~18s): keep tracking WHILE a coloured chip flashes at the top
 * every ~1.5–2.5s. Tap "Now!" only when the chip is the TARGET colour (orange);
 * ignore the rest. We record hits / misses / false-alarms AND keep sampling
 * tracking so we can show the drop.
 *
 * Honest score: tracking% single vs tracking% dual (the cost), plus cue accuracy.
 * The drop is the point — everyone pays it. Never shaming.
 */

const W = 640;
const H = 420;
const HIT_RADIUS = 46; // generous tracking radius — this is divided attention, not pixel-hunting
const PHASE_A_MS = 12_000;
const PHASE_B_MS = 18_000;
const CUE_VISIBLE_MS = 1100; // window to respond after a cue appears
const TARGET_COLOR = '#FA961C'; // orange — the "Now!" colour
const DISTRACTOR_COLORS = ['#107099', '#3FA796', '#C0560C', '#1A8FBF'];

const BEST_KEY = 'stunprex_twothings_best';

type Phase = 'ready' | 'single' | 'dual' | 'over';

interface Cue {
  id: number;
  color: string;
  isTarget: boolean;
  shownAt: number; // performance.now()
  responded: boolean; // player tapped Now! for this cue
}

interface Result {
  trackSingle: number; // %
  trackDual: number; // %
  cost: number; // percentage points dropped
  hits: number;
  misses: number;
  falseAlarms: number;
  cueAccuracy: number; // % of correct decisions
  takeaway: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function TwoThingsAtOnce() {
  const { isAuthed } = useGamesAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhase] = useState<Phase>('ready');
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // HUD (mirrored from refs each frame)
  const [timeLeft, setTimeLeft] = useState(0);
  const [hudTrack, setHudTrack] = useState(0);
  const [hudHits, setHudHits] = useState(0);

  // Active cue surfaced to the DOM button row
  const [activeCue, setActiveCue] = useState<Cue | null>(null);

  // ── Mutable game state in refs (no stale-closure bugs) ──────────────────────
  const reducedMotion = useRef(false);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('ready');
  const phaseStartRef = useRef(0);

  // Ball motion
  const ballRef = useRef({ x: W / 2, y: H / 2, angle: 0 });
  const targetRef = useRef({ x: W / 2, y: H / 2 }); // wander waypoint
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: W / 2,
    y: H / 2,
    active: false,
  });

  // Per-phase tracking frame tallies
  const trackARef = useRef({ on: 0, total: 0 });
  const trackBRef = useRef({ on: 0, total: 0 });

  // Cue state (Phase B only)
  const cueRef = useRef<Cue | null>(null);
  const nextCueAtRef = useRef(0);
  const nextCueIdRef = useRef(0);
  const cueStatsRef = useRef({ hits: 0, misses: 0, falseAlarms: 0, targets: 0, distractors: 0 });

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isAuthed) return; // saved progress is for account holders
    try {
      const v = window.localStorage.getItem(BEST_KEY);
      if (v) setBest(Number(v));
    } catch {
      /* ignore */
    }
  }, [isAuthed]);

  // Pointer sampling — store latest logical-coord position; per-frame distance does the rest.
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
      active: true,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      handlePointerMove(e);
    },
    [handlePointerMove],
  );

  const handlePointerLeave = useCallback(() => {
    pointerRef.current.active = false;
  }, []);

  // Pick a fresh wander waypoint inside bounds.
  const pickWaypoint = useCallback(() => {
    const margin = 70;
    targetRef.current = {
      x: lerp(margin, W - margin, Math.random()),
      y: lerp(margin, H - margin, Math.random()),
    };
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, onTarget: boolean) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#EAF4F2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(16,112,153,0.04)';
      for (let i = 0; i < 5; i++) ctx.fillRect(0, (H / 5) * i, W, 1);

      const b = ballRef.current;

      // Tracking ring — green-ish when on target, neutral when off (no red/shame)
      ctx.beginPath();
      ctx.arc(b.x, b.y, HIT_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = onTarget ? 'rgba(63,167,150,0.55)' : 'rgba(16,112,153,0.18)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // The ball
      ctx.beginPath();
      ctx.arc(b.x, b.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#107099';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x - 4, b.y - 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();

      // Pointer marker (where the finger/cursor is)
      const p = pointerRef.current;
      if (p.active) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#FA961C';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    [],
  );

  const computeResult = useCallback((): Result => {
    const a = trackARef.current;
    const bd = trackBRef.current;
    const trackSingle = a.total > 0 ? Math.round((a.on / a.total) * 100) : 0;
    const trackDual = bd.total > 0 ? Math.round((bd.on / bd.total) * 100) : 0;
    const cost = Math.max(0, trackSingle - trackDual);

    const cs = cueStatsRef.current;
    const correctDecisions = cs.hits + (cs.distractors - cs.falseAlarms);
    const totalDecisions = cs.targets + cs.distractors;
    const cueAccuracy =
      totalDecisions > 0 ? Math.round((Math.max(0, correctDecisions) / totalDecisions) * 100) : 0;

    let takeaway: string;
    if (cost <= 4) {
      takeaway =
        `Your tracking barely moved (${cost}%) once the second task started — rare, and a sign you ` +
        `left real attention to spare. Most players drop more.`;
    } else {
      takeaway =
        `Your tracking dipped ${cost}% once the second task started — that's the cost of divided ` +
        `attention, and everyone pays it. The skill isn't avoiding the tax, it's keeping it small.`;
    }

    return {
      trackSingle,
      trackDual,
      cost,
      hits: cs.hits,
      misses: cs.misses,
      falseAlarms: cs.falseAlarms,
      cueAccuracy,
      takeaway,
    };
  }, []);

  const endGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const r = computeResult();
    setResult(r);
    setActiveCue(null);
    phaseRef.current = 'over';
    setPhase('over');

    // Score = dual-task tracking weighted by cue accuracy. Volume × accuracy, never volume alone.
    const score = Math.round((r.trackDual * r.cueAccuracy) / 100);

    if (!isAuthed) {
      setIsNewBest(false);
      return;
    }
    try {
      const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
      if (score > prev) {
        window.localStorage.setItem(BEST_KEY, String(score));
        setBest(score);
        setIsNewBest(true);
      } else {
        setIsNewBest(false);
      }
    } catch {
      /* ignore */
    }
  }, [computeResult, isAuthed]);

  // Resolve the currently-shown cue: if it was a target and went unanswered → miss.
  const expireCue = useCallback(() => {
    const c = cueRef.current;
    if (c && !c.responded) {
      if (c.isTarget) cueStatsRef.current.misses += 1;
    }
    cueRef.current = null;
    setActiveCue(null);
  }, []);

  const spawnCue = useCallback((now: number) => {
    const isTarget = Math.random() < 0.45;
    const color = isTarget
      ? TARGET_COLOR
      : DISTRACTOR_COLORS[Math.floor(Math.random() * DISTRACTOR_COLORS.length)];
    const cue: Cue = {
      id: nextCueIdRef.current++,
      color,
      isTarget,
      shownAt: now,
      responded: false,
    };
    cueRef.current = cue;
    if (isTarget) cueStatsRef.current.targets += 1;
    else cueStatsRef.current.distractors += 1;
    setActiveCue(cue);
    // schedule the next cue 1.5–2.5s out
    nextCueAtRef.current = now + lerp(1500, 2500, Math.random());
  }, []);

  const loop = useCallback(
    (now: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const inDual = phaseRef.current === 'dual';
      const phaseMs = inDual ? PHASE_B_MS : PHASE_A_MS;
      const elapsed = now - phaseStartRef.current;
      const t = Math.min(elapsed / phaseMs, 1);

      // ── Ball motion: wander toward waypoint; reduced-motion = slower, no jitter ──
      const b = ballRef.current;
      const tgt = targetRef.current;
      const dx = tgt.x - b.x;
      const dy = tgt.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 24) pickWaypoint();

      const baseSpeed = reducedMotion.current ? 1.4 : lerp(2.0, 3.4, t);
      if (dist > 0.001) {
        b.x += (dx / dist) * baseSpeed;
        b.y += (dy / dist) * baseSpeed;
      }
      // small organic drift unless reduced motion
      if (!reducedMotion.current) {
        b.angle += 0.05;
        b.x += Math.cos(b.angle) * 0.6;
        b.y += Math.sin(b.angle * 1.3) * 0.6;
      }
      // keep in bounds
      b.x = Math.max(24, Math.min(W - 24, b.x));
      b.y = Math.max(24, Math.min(H - 24, b.y));

      // ── Tracking sample ──
      const p = pointerRef.current;
      const onTarget = p.active && Math.hypot(p.x - b.x, p.y - b.y) <= HIT_RADIUS;
      const tally = inDual ? trackBRef.current : trackARef.current;
      tally.total += 1;
      if (onTarget) tally.on += 1;

      // ── Cue handling (dual only) ──
      if (inDual) {
        const c = cueRef.current;
        if (c && now - c.shownAt >= CUE_VISIBLE_MS) expireCue();
        if (!cueRef.current && now >= nextCueAtRef.current) spawnCue(now);
      }

      draw(ctx, onTarget);

      // HUD
      setTimeLeft(Math.max(0, phaseMs - elapsed));
      const liveTrack = tally.total > 0 ? Math.round((tally.on / tally.total) * 100) : 0;
      setHudTrack(liveTrack);
      setHudHits(cueStatsRef.current.hits);

      if (elapsed >= phaseMs) {
        if (!inDual) {
          // Transition single → dual
          phaseRef.current = 'dual';
          setPhase('dual');
          phaseStartRef.current = now;
          nextCueAtRef.current = now + 800; // brief beat before first cue
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        endGame();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [draw, pickWaypoint, expireCue, spawnCue, endGame],
  );

  const start = useCallback(() => {
    trackARef.current = { on: 0, total: 0 };
    trackBRef.current = { on: 0, total: 0 };
    cueStatsRef.current = { hits: 0, misses: 0, falseAlarms: 0, targets: 0, distractors: 0 };
    cueRef.current = null;
    nextCueIdRef.current = 0;
    setActiveCue(null);
    setResult(null);
    setIsNewBest(false);

    ballRef.current = { x: W / 2, y: H / 2, angle: 0 };
    pointerRef.current = { x: W / 2, y: H / 2, active: false };
    pickWaypoint();

    phaseRef.current = 'single';
    setPhase('single');
    phaseStartRef.current = performance.now();
    setTimeLeft(PHASE_A_MS);
    setHudTrack(0);
    setHudHits(0);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, pickWaypoint]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // "Now!" tap — judged against the live cue.
  const handleNow = useCallback(() => {
    if (phaseRef.current !== 'dual') return;
    const c = cueRef.current;
    if (!c || c.responded) {
      // No cue on screen → tapping into empty air is a false alarm (you reacted to nothing).
      cueStatsRef.current.falseAlarms += 1;
      return;
    }
    c.responded = true;
    if (c.isTarget) {
      cueStatsRef.current.hits += 1;
      setHudHits(cueStatsRef.current.hits);
    } else {
      cueStatsRef.current.falseAlarms += 1; // tapped on a non-target colour
    }
    setActiveCue({ ...c }); // reflect "responded" styling
  }, []);

  const seconds = Math.ceil(timeLeft / 1000);
  const playing = phase === 'single' || phase === 'dual';
  const cueShowing = activeCue !== null;

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-3 font-ui text-sm text-brown/70">
        <span>{phase === 'dual' ? 'Both at once' : phase === 'single' ? 'Track only' : 'Two Things'}</span>
        {playing && <span>{seconds}s</span>}
        {playing && <span>Tracking {hudTrack}%</span>}
        <span className="flex-1" />
        {phase === 'dual' && <span>Hits {hudHits}</span>}
        {isAuthed && best != null ? <span>Best: {best}</span> : <span />}
      </div>

      {/* Play area */}
      <div className="relative overflow-hidden rounded-lg border border-deepblue/15">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="block w-full touch-none"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="Two Things at Once game area"
          role="img"
        />

        {/* ── DUAL-phase cue strip + Now! button (over the canvas, top) ── */}
        {phase === 'dual' && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-4 p-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 shadow"
              style={{
                backgroundColor: cueShowing ? activeCue!.color : 'rgba(16,112,153,0.10)',
                transition: reducedMotion.current ? 'none' : 'background-color 90ms linear',
              }}
              aria-hidden
            />
            <button
              onClick={handleNow}
              className="pointer-events-auto min-h-[44px] rounded-lg bg-orange px-6 py-2 font-ui text-base font-bold text-white shadow active:translate-y-px"
            >
              Now!
            </button>
          </div>
        )}

        {/* ── READY / OVER overlays ── */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-mint/90 p-6 text-center">
            {phase === 'ready' ? (
              <>
                <h3 className="font-heading text-2xl text-deepblue">Two Things at Once</h3>
                <p className="mt-2 max-w-md font-body text-brown/80">
                  Keep your finger on the moving ball. First you only track it. Then,
                  while still tracking, a chip flashes at the top — tap <strong>Now!</strong>{' '}
                  only when it&rsquo;s <span className="font-semibold text-orange">orange</span>,
                  ignore every other colour. The point is what happens to your tracking once the
                  second job starts.
                </p>
                <button onClick={start} className="btn-primary mt-5">
                  Start — track only, then both
                </button>
              </>
            ) : (
              result && (
                <>
                  <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
                  <div className="mt-3 font-body text-brown/85">
                    <div className="flex items-end justify-center gap-6">
                      <div>
                        <p className="font-heading text-3xl text-deepblue">{result.trackSingle}%</p>
                        <p className="font-ui text-xs uppercase tracking-widest text-brown/55">
                          Single
                        </p>
                      </div>
                      <div className="pb-2 text-2xl text-brown/40">→</div>
                      <div>
                        <p className="font-heading text-3xl text-deepblue">{result.trackDual}%</p>
                        <p className="font-ui text-xs uppercase tracking-widest text-brown/55">
                          Dual
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 font-ui text-sm">
                      Dual-task cost <strong>−{result.cost}%</strong> tracking
                    </p>
                    <p className="mt-1 text-sm">
                      Cues — hits <strong>{result.hits}</strong> · misses{' '}
                      <strong>{result.misses}</strong> · false alarms{' '}
                      <strong>{result.falseAlarms}</strong>
                    </p>
                    <p className="mt-1 text-sm text-brown/70">Cue accuracy {result.cueAccuracy}%.</p>
                    <p className="mt-3 max-w-sm text-sm italic text-brown/60">{result.takeaway}</p>
                  </div>
                  <div className="max-w-sm">
                    <SavePrompt isBest={isNewBest} />
                  </div>
                  <button onClick={start} className="btn-primary mt-5">
                    Play again
                  </button>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
