'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Koi Pond v2 — selective attention, multiple-object tracking, working memory.
 * Feed every fish ONCE. A visible feed-cooldown runs between feeds. The game
 * never marks which fish to feed — you must remember who you've already fed as
 * they swim and mix (colour is the only aid). Re-feeding a fish is the mistake.
 * Clear the pond and it grows by one fish, faster water. Honest scoring.
 */

const ROUND_MS = 60_000;
const W = 640;
const H = 420;
const HIT_RADIUS = 30;
const COOLDOWN = 1300;
const MAX_FISH = 6;

const KOI_COLORS = ['#FA961C', '#107099', '#E8743B', '#1A8FBF', '#C0560C', '#3FA796'];
const BEST_KEY = 'stunprex_koipond_best';

interface Fish {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  fed: boolean;
  anim: number;
  bad: boolean;
}

type Phase = 'ready' | 'playing' | 'over';
interface Stats {
  fed: number;
  doubles: number;
  ponds: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function KoiPond() {
  const { isAuthed } = useGamesAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [stats, setStats] = useState<Stats>({ fed: 0, doubles: 0, ponds: 0 });
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [feedRemaining, setFeedRemaining] = useState(0);
  const [fedCount, setFedCount] = useState(0);
  const [fishTotal, setFishTotal] = useState(4);

  const fishRef = useRef<Fish[]>([]);
  const statsRef = useRef<Stats>({ fed: 0, doubles: 0, ponds: 0 });
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const readyRef = useRef<number>(0); // performance.now() when feeding is allowed again
  const levelRef = useRef<number>(0);
  const nextIdRef = useRef<number>(0);
  const flashRef = useRef<{ text: string; until: number } | null>(null);
  const reducedMotion = useRef<boolean>(false);

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

  const buildPond = useCallback((n: number) => {
    const arr: Fish[] = [];
    for (let i = 0; i < n; i++) {
      const heading = Math.random() * Math.PI * 2;
      const speed = lerp(0.6, 1.0, Math.random()) * (1 + levelRef.current * 0.12);
      arr.push({
        id: nextIdRef.current++,
        x: lerp(60, W - 60, Math.random()),
        y: lerp(60, H - 60, Math.random()),
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        color: KOI_COLORS[i % KOI_COLORS.length],
        fed: false,
        anim: 0,
        bad: false,
      });
    }
    fishRef.current = arr;
    setFishTotal(n);
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, elapsedSec: number) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#EAF4F2';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(16,112,153,0.04)';
    for (let i = 0; i < 5; i++) ctx.fillRect(0, (H / 5) * i, W, 1);

    for (const f of fishRef.current) {
      if (f.anim > 0) {
        const p = 1 - f.anim / 500;
        const col = f.bad ? '229,75,74' : '16,112,153';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 14 + p * 24, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col},${0.4 * (1 - p)})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      const angle = Math.atan2(f.vy, f.vx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-22, -7);
      ctx.lineTo(-22, 7);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.restore();
    }

    const flash = flashRef.current;
    if (flash && elapsedSec * 1000 < flash.until) {
      ctx.fillStyle = 'rgba(16,112,153,0.9)';
      ctx.font = '500 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(flash.text, W / 2, 40);
    }
  }, []);

  const endRound = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const s = statsRef.current;
    const score = Math.max(0, Math.round(s.fed * 10 + s.ponds * 25 - s.doubles * 8));
    setStats({ ...s });
    setPhase('over');
    if (!isAuthed) {
      setIsNewBest(false);
      return; // play is open; saving requires a free account (SavePrompt handles the invite)
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
  }, [isAuthed]);

  const loop = useCallback(
    (now: number) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / ROUND_MS, 1);
      const speedMul = lerp(1, 1.5, t);

      for (const f of fishRef.current) {
        f.x += f.vx * speedMul;
        f.y += f.vy * speedMul;
        if (!reducedMotion.current && Math.random() < 0.02) {
          const a = Math.atan2(f.vy, f.vx) + (Math.random() - 0.5) * 0.8;
          const sp = Math.hypot(f.vx, f.vy);
          f.vx = Math.cos(a) * sp;
          f.vy = Math.sin(a) * sp;
        }
        if (f.x < 24) { f.x = 24; f.vx = Math.abs(f.vx); }
        if (f.x > W - 24) { f.x = W - 24; f.vx = -Math.abs(f.vx); }
        if (f.y < 24) { f.y = 24; f.vy = Math.abs(f.vy); }
        if (f.y > H - 24) { f.y = H - 24; f.vy = -Math.abs(f.vy); }
        if (f.anim > 0) f.anim -= 16;
      }

      draw(ctx, elapsed / 1000);
      setTimeLeft(Math.max(0, ROUND_MS - elapsed));
      setFeedRemaining(Math.max(0, readyRef.current - now));
      setFedCount(fishRef.current.filter((f) => f.fed).length);

      if (elapsed >= ROUND_MS) {
        endRound();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [draw, endRound],
  );

  const start = useCallback(() => {
    statsRef.current = { fed: 0, doubles: 0, ponds: 0 };
    setStats({ fed: 0, doubles: 0, ponds: 0 });
    levelRef.current = 0;
    flashRef.current = null;
    buildPond(4);
    startRef.current = performance.now();
    readyRef.current = startRef.current;
    setTimeLeft(ROUND_MS);
    setFeedRemaining(0);
    setFedCount(0);
    setPhase('playing');
    rafRef.current = requestAnimationFrame(loop);
  }, [buildPond, loop]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handlePointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== 'playing') return;
      const now = performance.now();
      if (now < readyRef.current) return; // feed on cooldown
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * W;
      const py = ((e.clientY - rect.top) / rect.height) * H;

      let nearest: Fish | null = null;
      let nearestDist = HIT_RADIUS;
      for (const f of fishRef.current) {
        const d = Math.hypot(f.x - px, f.y - py);
        if (d < nearestDist) {
          nearest = f;
          nearestDist = d;
        }
      }
      if (!nearest) return; // open water — no penalty
      readyRef.current = now + COOLDOWN;
      if (nearest.fed) {
        statsRef.current.doubles += 1;
        nearest.anim = 500;
        nearest.bad = true;
      } else {
        nearest.fed = true;
        nearest.anim = 500;
        nearest.bad = false;
        statsRef.current.fed += 1;
        if (fishRef.current.every((f) => f.fed)) {
          statsRef.current.ponds += 1;
          levelRef.current += 1;
          flashRef.current = { text: 'Pond fed! +1 fish', until: now - startRef.current + 1100 };
          buildPond(Math.min(MAX_FISH, 4 + levelRef.current));
          readyRef.current = now + COOLDOWN;
        }
      }
    },
    [phase, buildPond],
  );

  const tot = stats.fed + stats.doubles;
  const accuracy = tot > 0 ? Math.round((stats.fed / tot) * 100) : 0;
  const score = Math.max(0, Math.round(stats.fed * 10 + stats.ponds * 25 - stats.doubles * 8));
  const seconds = Math.ceil(timeLeft / 1000);
  const feedPct = feedRemaining <= 0 ? 100 : Math.round((1 - feedRemaining / COOLDOWN) * 100);

  return (
    <div className="max-w-[640px]">
      <div className="mb-3 flex items-center gap-3 font-ui text-sm text-brown/70">
        <span>Time: {seconds}s</span>
        <span>Fed: {fedCount}/{fishTotal}</span>
        <span className="flex-1" />
        <span className="min-w-[68px]">
          {feedRemaining <= 0 ? 'Feed: ready' : `Feed: ${(feedRemaining / 1000).toFixed(1)}s`}
        </span>
        <span className="h-2 w-24 overflow-hidden rounded-full bg-deepblue/15">
          <span className="block h-full bg-orange" style={{ width: `${feedPct}%` }} />
        </span>
        {isAuthed && best != null ? <span>Best: {best}</span> : <span />}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-deepblue/15">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={handlePointer}
          className="block w-full touch-none"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="Koi pond game area"
          role="img"
        />

        {phase !== 'playing' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-mint/90 p-6 text-center">
            {phase === 'ready' ? (
              <>
                <h3 className="font-heading text-deepblue text-2xl">Koi Pond</h3>
                <p className="mt-2 max-w-md text-brown/80 font-body">
                  Feed every fish once. Wait for the feed timer between feeds. Don’t
                  feed any fish twice — track them by colour as they swim. Clear the
                  pond and it grows.
                </p>
                <button onClick={start} className="btn-primary mt-5">
                  Start — 60 seconds
                </button>
              </>
            ) : (
              <>
                <h3 className="font-heading text-deepblue text-2xl">Round complete</h3>
                <div className="mt-3 font-body text-brown/85">
                  <p className="text-3xl font-heading text-deepblue">{score}</p>
                  <p className="mt-2 text-sm">
                    Fed <strong>{stats.fed}</strong> · re-fed{' '}
                    <strong>{stats.doubles}</strong> · ponds{' '}
                    <strong>{stats.ponds}</strong>
                  </p>
                  <p className="mt-1 text-sm text-brown/70">Accuracy {accuracy}%.</p>
                  <p className="mt-3 max-w-sm text-sm text-brown/60 italic">
                    {stats.doubles > 2
                      ? 'You re-fed a few — lock each fish to its colour before you feed.'
                      : 'Clean tracking — next round, feed the pond a little faster.'}
                  </p>
                </div>
                <div className="max-w-sm">
                  <SavePrompt isBest={isNewBest} />
                </div>
                <button onClick={start} className="btn-primary mt-5">
                  Play again
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
