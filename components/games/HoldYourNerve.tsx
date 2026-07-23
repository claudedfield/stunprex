'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Hold Your Nerve — focus under rising arousal (Affective). Echoes the penalty
 * walk-up: a gentle precision aim/timing task while soft VISUAL pressure rises
 * over the round. ~12 spot kicks. Each kick a target appears; a ring shrinks
 * toward the centre as a timing guide. Tap as close to the centre as you can,
 * ideally as the ring reaches the sweet-spot. There is NO fail state — every
 * tap scores its precision, a wild miss simply scores low, never shamed.
 * Honest score = average precision under load. Visual-only pressure, no audio.
 */

const KICKS = 12;
const RING_MS = 2000; // ms for the ring to shrink from full to centre
const SWEET_SPOT = 0.7; // normalised ring progress where the sweet-spot sits
const SETTLE_MS = 750; // pause showing the per-kick read before the next
const PLAY_W = 640; // logical play-area width  (matched to aspect 16/9-ish)
const PLAY_H = 420; // logical play-area height
const TARGET_R = 46; // visual target radius (logical px) — well over 36px tap zone
const BEST_KEY = 'stunprex_holdyournerve_best';

type Phase = 'ready' | 'aiming' | 'settle' | 'over';

interface Spot {
  cx: number; // target centre, logical px
  cy: number;
}

interface KickResult {
  precision: number; // 0–100 closeness of tap to centre
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Lay out the 12 spots up front, spread across the surface, away from edges. */
function buildSpots(): Spot[] {
  const margin = TARGET_R + 16;
  const spots: Spot[] = [];
  for (let i = 0; i < KICKS; i++) {
    spots.push({
      cx: lerp(margin, PLAY_W - margin, Math.random()),
      cy: lerp(margin, PLAY_H - margin, Math.random()),
    });
  }
  return spots;
}

export function HoldYourNerve() {
  const { isAuthed } = useGamesAuth();

  // ── UI state (drives renders) ──────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('ready');
  const [kickDisplay, setKickDisplay] = useState(0); // 1-based for HUD
  const [ringT, setRingT] = useState(0); // 0→1 ring shrink progress
  const [pressure, setPressure] = useState(0); // 0→1 ambient pressure level
  const [lastPrecision, setLastPrecision] = useState<number | null>(null);
  const [lastTap, setLastTap] = useState<{ x: number; y: number } | null>(null);
  const [avgPrecision, setAvgPrecision] = useState(0);
  const [bestKick, setBestKick] = useState(0);
  const [earlyAvg, setEarlyAvg] = useState(0);
  const [lateAvg, setLateAvg] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [takeaway, setTakeaway] = useState('');
  const [calmMode, setCalmMode] = useState(false);

  // ── Mutable game state in refs (no stale-closure issues) ───────────────────
  const spotsRef = useRef<Spot[]>([]);
  const kickIdxRef = useRef(0);
  const resultsRef = useRef<KickResult[]>([]);
  const ringStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useRef(false);
  const calmRef = useRef(false);

  // keep calmRef in sync so the live loop reads the latest value
  useEffect(() => {
    calmRef.current = calmMode;
  }, [calmMode]);

  // ── Mount: reduced-motion + load best (authed only) ────────────────────────
  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion.current) setCalmMode(true); // auto-calm: no pulsing
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAuthed]);

  // Stable ref to beginKick so a settle-timeout always calls the latest version
  const beginKickRef = useRef<(idx: number) => void>(() => {});

  const finish = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const results = resultsRef.current;
    const n = results.length;
    const avg = n > 0 ? Math.round(results.reduce((s, r) => s + r.precision, 0) / n) : 0;
    const peak = n > 0 ? Math.round(Math.max(...results.map((r) => r.precision))) : 0;

    const half = Math.floor(n / 2);
    const early = results.slice(0, half);
    const late = results.slice(half);
    const earlyA =
      early.length > 0
        ? Math.round(early.reduce((s, r) => s + r.precision, 0) / early.length)
        : 0;
    const lateA =
      late.length > 0
        ? Math.round(late.reduce((s, r) => s + r.precision, 0) / late.length)
        : 0;

    setAvgPrecision(avg);
    setBestKick(peak);
    setEarlyAvg(earlyA);
    setLateAvg(lateA);

    // Supportive takeaway — never a verdict, never shaming.
    if (lateA >= earlyA - 3) {
      setTakeaway('Your precision held as the pressure built — that is composure.');
    } else if (lateA >= earlyA - 12) {
      setTakeaway('It eased a little under the noise, but you stayed close — solid nerve.');
    } else {
      setTakeaway('It dipped as the noise rose — that is the rep, not a verdict. Keep walking up.');
    }

    setPressure(0);
    setPhase('over');

    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (avg > prev) {
          window.localStorage.setItem(BEST_KEY, String(avg));
          setBest(avg);
          setIsNewBest(true);
        }
      } catch {
        /* ignore */
      }
    }
  };

  const beginKick = (idx: number) => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (idx >= KICKS) {
      finish();
      return;
    }

    kickIdxRef.current = idx;
    setKickDisplay(idx + 1);
    setLastPrecision(null);
    setLastTap(null);
    setRingT(0);
    setPhase('aiming');

    ringStartRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - ringStartRef.current;
      // tempo rises gently across the round: the ring shrinks a touch faster later
      const t = idx / (KICKS - 1);
      const dur = lerp(RING_MS, RING_MS * 0.78, t);
      const progress = elapsed / dur;
      setRingT(Math.min(1, progress));

      // ambient pressure ramps with the kick index; calm mode dampens it.
      const target = calmRef.current ? t * 0.35 : t;
      setPressure(target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Ring reached the centre with no tap: still scores (closeness=0 here),
        // never a "miss" — the player simply didn't release. Gentle, not punitive.
        rafRef.current = null;
        if (phaseIsAimingRef.current) {
          recordTapRef.current(null, null);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  beginKickRef.current = beginKick;

  // phase mirror in a ref so RAF / timer callbacks read the live value, not a
  // stale closure value captured when beginKick first ran.
  const phaseIsAimingRef = useRef(false);
  useEffect(() => {
    phaseIsAimingRef.current = phase === 'aiming';
  }, [phase]);

  // Stable ref to recordTap so the RAF auto-resolve always calls the latest one.
  const recordTapRef = useRef<(px: number | null, py: number | null) => void>(() => {});

  /**
   * Score a tap. `px/py` are logical coords (null = ring elapsed with no tap).
   * Precision is mostly closeness-to-centre, lightly nudged by timing closeness
   * to the sweet-spot. A wild miss scores low — no shame, no red, no "wrong".
   */
  const recordTap = (px: number | null, py: number | null) => {
    if (!phaseIsAimingRef.current) return;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const spot = spotsRef.current[kickIdxRef.current];
    let precision: number;

    if (px === null || py === null) {
      precision = 0; // ring closed unreleased — counts, gently, as a low rep
    } else {
      const dist = Math.hypot(px - spot.cx, py - spot.cy);
      // closeness: full marks within ~6px, fading out by ~half the play height
      const maxDist = PLAY_H * 0.5;
      const closeness = clamp(1 - (dist - 6) / maxDist, 0, 1);

      // timing: how near the ring was to the sweet-spot when released
      const timingErr = Math.abs(ringT - SWEET_SPOT);
      const timing = clamp(1 - timingErr / 0.5, 0, 1);

      // 80% aim, 20% timing — aim leads, timing lightly factored as the spec asks
      precision = Math.round((closeness * 0.8 + timing * 0.2) * 100);
      setLastTap({ x: px, y: py });
    }

    resultsRef.current.push({ precision });
    setLastPrecision(precision);
    setPhase('settle');

    const nextIdx = kickIdxRef.current + 1;
    timerRefs.current.push(
      setTimeout(() => beginKickRef.current(nextIdx), SETTLE_MS),
    );
  };
  recordTapRef.current = recordTap;

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'aiming') return;
    const surface = e.currentTarget;
    const rect = surface.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * PLAY_W;
    const py = ((e.clientY - rect.top) / rect.height) * PLAY_H;
    recordTap(px, py);
  };

  const start = () => {
    resultsRef.current = [];
    kickIdxRef.current = 0;
    setAvgPrecision(0);
    setBestKick(0);
    setEarlyAvg(0);
    setLateAvg(0);
    setIsNewBest(false);
    spotsRef.current = buildSpots();
    beginKickRef.current(0);
  };

  // ── Derived render values ──────────────────────────────────────────────────
  const liveResults = resultsRef.current;
  const liveAvg =
    liveResults.length > 0
      ? Math.round(liveResults.reduce((s, r) => s + r.precision, 0) / liveResults.length)
      : 0;
  const spot = spotsRef.current[kickIdxRef.current];

  // pressure → soft pulsing tint overlay. No audio, ever. Reduced-motion = static.
  const showPulse = !calmMode && !reducedMotion.current && phase === 'aiming';
  const tintAlpha = 0.05 + pressure * 0.16;
  const ringRadius = lerp(TARGET_R + 64, TARGET_R + 2, ringT);
  const inSweetSpot = Math.abs(ringT - SWEET_SPOT) < 0.06;

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        <span>
          Kick {Math.min(kickDisplay, KICKS)}/{KICKS}
        </span>
        {phase !== 'ready' && phase !== 'over' && liveResults.length > 0 && (
          <span>Precision {liveAvg}</span>
        )}
        <span className="flex-1" />
        {(phase === 'aiming' || phase === 'settle') && (
          <button
            type="button"
            onClick={() => setCalmMode((c) => !c)}
            className="rounded-full border border-deepblue/25 px-3 py-1 font-ui text-xs text-deepblue transition-colors hover:border-orange hover:text-orange"
            aria-pressed={calmMode}
          >
            {calmMode ? 'Calm: on' : 'Calm it down'}
          </button>
        )}
        {isAuthed && best !== null && <span>Best: {best}</span>}
      </div>

      {/* Play area */}
      <div
        onPointerDown={handlePointer}
        className="relative touch-none select-none overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: `${PLAY_W} / ${PLAY_H}`, cursor: phase === 'aiming' ? 'crosshair' : 'default' }}
        aria-label="Hold Your Nerve play area"
        role="img"
      >
        {/* Ambient pressure tint (visual only, NO audio). Static when calm/reduced-motion;
            a soft Tailwind pulse layer fades in/out gently when pressure is allowed. */}
        {(phase === 'aiming' || phase === 'settle') && (
          <>
            <div
              className="pointer-events-none absolute inset-0"
              style={{ backgroundColor: '#FA961C', opacity: tintAlpha }}
            />
            {showPulse && (
              <div
                className="pointer-events-none absolute inset-0 animate-pulse"
                style={{ backgroundColor: '#FA961C', opacity: tintAlpha * 0.6 }}
              />
            )}
          </>
        )}

        {/* AIMING phase — target + shrinking timing ring */}
        {phase === 'aiming' && spot && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${PLAY_W} ${PLAY_H}`}
            preserveAspectRatio="none"
          >
            {/* faint drift lines for a calm, alive surface */}
            <g opacity={0.05}>
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={0}
                  x2={PLAY_W}
                  y1={(PLAY_H / 4) * i + 24}
                  y2={(PLAY_H / 4) * i + 24}
                  stroke="#107099"
                  strokeWidth={1}
                />
              ))}
            </g>

            {/* target: outer circle + small centre bullseye */}
            <circle
              cx={spot.cx}
              cy={spot.cy}
              r={TARGET_R}
              fill="rgba(16,112,153,0.06)"
              stroke="#107099"
              strokeOpacity={0.45}
              strokeWidth={2}
            />
            <circle cx={spot.cx} cy={spot.cy} r={TARGET_R * 0.5} fill="none" stroke="#107099" strokeOpacity={0.3} strokeWidth={1.5} />
            <circle cx={spot.cx} cy={spot.cy} r={5} fill="#FA961C" />

            {/* shrinking timing ring — turns warm at the sweet-spot */}
            <circle
              cx={spot.cx}
              cy={spot.cy}
              r={ringRadius}
              fill="none"
              stroke={inSweetSpot ? '#FA961C' : '#107099'}
              strokeOpacity={inSweetSpot ? 0.95 : 0.6}
              strokeWidth={inSweetSpot ? 4 : 2.5}
            />
          </svg>
        )}

        {/* SETTLE phase — show where the tap landed + the per-kick precision read */}
        {phase === 'settle' && spot && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 ${PLAY_W} ${PLAY_H}`}
            preserveAspectRatio="none"
          >
            <circle
              cx={spot.cx}
              cy={spot.cy}
              r={TARGET_R}
              fill="rgba(16,112,153,0.06)"
              stroke="#107099"
              strokeOpacity={0.35}
              strokeWidth={2}
            />
            <circle cx={spot.cx} cy={spot.cy} r={5} fill="#FA961C" />
            {lastTap && (
              <>
                <line
                  x1={spot.cx}
                  y1={spot.cy}
                  x2={lastTap.x}
                  y2={lastTap.y}
                  stroke="#107099"
                  strokeOpacity={0.3}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <circle cx={lastTap.x} cy={lastTap.y} r={7} fill="#FA961C" fillOpacity={0.85} />
              </>
            )}
          </svg>
        )}

        {/* SETTLE read-out — supportive, neutral language */}
        {phase === 'settle' && lastPrecision !== null && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-deepblue/85 px-4 py-1 font-ui text-sm text-white">
              {lastPrecision >= 85
                ? `Composed — ${lastPrecision}`
                : lastPrecision >= 55
                ? `Steady — ${lastPrecision}`
                : lastPrecision > 0
                ? `Noted — ${lastPrecision}`
                : `Held — let the next ring guide you`}
            </span>
          </div>
        )}

        {/* aiming hint */}
        {phase === 'aiming' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
            <span className="font-ui text-[11px] uppercase tracking-widest text-brown/45">
              Tap the centre as the ring closes
            </span>
          </div>
        )}

        {/* READY overlay */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Hold Your Nerve</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              Twelve spot kicks. Each one, a target appears and a ring closes toward its
              centre. Tap as close to the bullseye as you can — ideally as the ring reaches
              the sweet-spot. The room gets a little louder as you go, but the only job is to
              stay precise. There is no miss here — every tap is a rep.
            </p>
            <p className="mt-2 font-ui text-xs text-brown/55">
              You can ease the pressure any time with “Calm it down”.
            </p>
            <button onClick={start} className="btn-primary mt-5">
              Step up — {KICKS} kicks
            </button>
          </div>
        )}

        {/* OVER overlay */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Walk-up complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">
              {avgPrecision}
              <span className="text-2xl text-deepblue/60">/100</span>
            </p>
            <p className="mt-1 font-ui text-sm text-brown/70">Precision under load</p>
            <p className="mt-2 font-body text-sm text-brown/75">
              {KICKS} kicks taken · best single kick <strong>{bestKick}</strong>
            </p>
            <p className="mt-1 font-ui text-xs text-brown/60">
              Early {earlyAvg} → late {lateAvg}
            </p>
            <p className="mt-3 max-w-xs font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} game="hold-your-nerve" />
            </div>
            <button onClick={start} className="btn-primary mt-4">
              Step up again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
