'use client';

import { useState, useEffect, useRef } from 'react';
import { useGamesAuth } from './gamesAuth';
import { SavePrompt } from './SavePrompt';

/**
 * Peripheral Pulse — dual-task: peripheral detection while holding central focus.
 * Central zone: a digit flickers every 2–3 s; tap the centre when it matches the
 * target shown in the HUD. Left / right zones: a bright pulse appears briefly at
 * varying heights; tap that side to register it.
 *
 * Score = peripheral hit % × central accuracy.
 * If you ignore the centre you score zero — you can't win by abandoning the focus task.
 * 60-second continuous round; difficulty ramps over time via t.
 */

const ROUND_MS = 60_000;
const BEST_KEY = 'stunprex_peripheralpulse_best';

type GamePhase = 'ready' | 'playing' | 'over';
type PulseSide = 'left' | 'right';

interface Pulse {
  side: PulseSide;
  yPct: number; // 15–85 %
  id: number; // unique id to detect stale clears
}

interface GameScore {
  periphHits: number;
  totalPulses: number;
  centralHits: number;
  centralTargets: number;
  centralFalseAlarms: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rng(seed: number) {
  let s = (seed ^ 0xcafe1234) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >>> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return s / 0x100000000;
  };
}

export function PeripheralPulse() {
  const { isAuthed } = useGamesAuth();

  const [phase, setPhase] = useState<GamePhase>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [centralDigit, setCentralDigit] = useState<number>(7);
  const [targetDigit, setTargetDigit] = useState<number>(5);
  const [activePulse, setActivePulse] = useState<Pulse | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const [finalScore, setFinalScore] = useState<GameScore>({
    periphHits: 0,
    totalPulses: 0,
    centralHits: 0,
    centralTargets: 0,
    centralFalseAlarms: 0,
  });

  // Mutable state in refs to avoid stale closures in timer callbacks
  const startTimeRef = useRef(0);
  const scoreRef = useRef<GameScore>({
    periphHits: 0,
    totalPulses: 0,
    centralHits: 0,
    centralTargets: 0,
    centralFalseAlarms: 0,
  });
  const targetDigitRef = useRef(5);
  const centralDigitRef = useRef(7);
  const activePulseRef = useRef<Pulse | null>(null);
  const randRef = useRef<() => number>(() => 0);
  const pulseIdCounterRef = useRef(0);

  // Timer refs for cleanup
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduledTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (isAuthed) {
      try {
        const v = window.localStorage.getItem(BEST_KEY);
        if (v) setBest(Number(v));
      } catch { /* ignore */ }
    }
    return () => stopAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const stopAll = () => {
    scheduledTimersRef.current.forEach(clearTimeout);
    scheduledTimersRef.current = [];
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const endGame = () => {
    stopAll();
    const s = { ...scoreRef.current };
    setFinalScore(s);
    setActivePulse(null);
    activePulseRef.current = null;
    setPhase('over');

    // Primary score = peripheral hit %
    const periphPct =
      s.totalPulses > 0 ? Math.round((s.periphHits / s.totalPulses) * 100) : 0;
    if (isAuthed) {
      try {
        const prev = Number(window.localStorage.getItem(BEST_KEY) ?? '0');
        if (periphPct > prev) {
          window.localStorage.setItem(BEST_KEY, String(periphPct));
          setBest(periphPct);
          setIsNewBest(true);
        }
      } catch { /* ignore */ }
    }
  };

  // Schedule the next digit change (self-rescheduling)
  const scheduleNextDigitChange = () => {
    const elapsed = performance.now() - startTimeRef.current;
    if (elapsed >= ROUND_MS) return;
    const t = elapsed / ROUND_MS;
    const interval = Math.round(lerp(2600, 1400, t));
    const id = setTimeout(() => {
      const elapsedNow = performance.now() - startTimeRef.current;
      if (elapsedNow >= ROUND_MS) return;
      const r = randRef.current;
      const newDigit = Math.floor(r() * 10);
      centralDigitRef.current = newDigit;
      if (newDigit === targetDigitRef.current) {
        scoreRef.current.centralTargets++;
      }
      setCentralDigit(newDigit);
      scheduleNextDigitChange();
    }, interval);
    scheduledTimersRef.current.push(id);
  };

  // Schedule the next peripheral pulse (self-rescheduling)
  const scheduleNextPulse = () => {
    const elapsed = performance.now() - startTimeRef.current;
    if (elapsed >= ROUND_MS) return;
    const t = elapsed / ROUND_MS;
    const gapMs = Math.round(lerp(4800, 2200, t));

    const id = setTimeout(() => {
      const elapsedNow = performance.now() - startTimeRef.current;
      if (elapsedNow >= ROUND_MS) return;
      const t2 = elapsedNow / ROUND_MS;
      const pulseDuration = Math.round(lerp(750, 350, t2));

      const r = randRef.current;
      const side: PulseSide = r() < 0.5 ? 'left' : 'right';
      const yPct = 15 + r() * 70;
      const pulseId = ++pulseIdCounterRef.current;
      const pulse: Pulse = { side, yPct, id: pulseId };

      scoreRef.current.totalPulses++;
      activePulseRef.current = pulse;
      setActivePulse(pulse);

      // Clear pulse after duration; if still the same pulse, it was missed
      const clearId = setTimeout(() => {
        if (activePulseRef.current?.id === pulseId) {
          activePulseRef.current = null;
          setActivePulse(null);
        }
        scheduleNextPulse();
      }, pulseDuration);
      scheduledTimersRef.current.push(clearId);
    }, gapMs);
    scheduledTimersRef.current.push(id);
  };

  const start = () => {
    stopAll();
    const r = rng(Date.now());
    randRef.current = r;

    const target = Math.floor(r() * 10);
    const firstDigit = Math.floor(r() * 10);

    targetDigitRef.current = target;
    centralDigitRef.current = firstDigit;
    scoreRef.current = {
      periphHits: 0,
      totalPulses: 0,
      centralHits: 0,
      // Count initial digit if it matches target
      centralTargets: firstDigit === target ? 1 : 0,
      centralFalseAlarms: 0,
    };
    activePulseRef.current = null;
    pulseIdCounterRef.current = 0;
    startTimeRef.current = performance.now();

    setTargetDigit(target);
    setCentralDigit(firstDigit);
    setActivePulse(null);
    setTimeLeft(60);
    setIsNewBest(false);
    setPhase('playing');

    // Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((ROUND_MS - elapsed) / 1000));
      setTimeLeft(remaining);
      if (elapsed >= ROUND_MS) endGame();
    }, 200);

    scheduleNextDigitChange();
    scheduleNextPulse();
  };

  // Tap handlers — called from the three tap zones
  const handleCenterTap = () => {
    if (phase !== 'playing') return;
    const isTarget = centralDigitRef.current === targetDigitRef.current;
    if (isTarget) {
      scoreRef.current.centralHits++;
    } else {
      scoreRef.current.centralFalseAlarms++;
    }
  };

  const handleSideTap = (side: PulseSide) => {
    if (phase !== 'playing') return;
    const pulse = activePulseRef.current;
    if (pulse && pulse.side === side) {
      scoreRef.current.periphHits++;
      activePulseRef.current = null;
      setActivePulse(null);
    }
    // Wrong side or no pulse — not penalised, just ignored
  };

  // Derived display values for the over screen
  const periphHitPct =
    finalScore.totalPulses > 0
      ? Math.round((finalScore.periphHits / finalScore.totalPulses) * 100)
      : 0;
  const centralHitPct =
    finalScore.centralTargets > 0
      ? Math.round((finalScore.centralHits / finalScore.centralTargets) * 100)
      : 100;
  // Combined = peripheral % × central accuracy (so you can't win by ignoring centre)
  const combined = Math.round((periphHitPct * centralHitPct) / 100);

  const takeaway =
    centralHitPct < 40
      ? "Your central focus drifted — don't abandon the centre digit task to chase pulses."
      : periphHitPct < 40
      ? 'You held the centre well but missed many pulses — keep the wide view active.'
      : combined >= 65
      ? 'Strong dual-task — you held both the centre and the edges.'
      : 'Decent run — the training effect builds with repetition.';

  return (
    <div className="max-w-[640px]">
      {/* HUD */}
      <div className="mb-3 flex items-center gap-4 font-ui text-sm text-brown/70">
        {phase === 'playing' && (
          <>
            <span
              className={`font-heading text-xl tabular-nums ${
                timeLeft <= 10 ? 'text-[#DC2626]' : 'text-deepblue'
              }`}
            >
              {timeLeft}s
            </span>
            <span className="rounded bg-orange/10 px-2 py-0.5 font-ui text-xs text-orange">
              Tap centre for: {targetDigit}
            </span>
          </>
        )}
        {phase !== 'playing' && <span className="flex-1" />}
        {isAuthed && best !== null && (
          <span className="ml-auto">Best: {best}%</span>
        )}
      </div>

      {/* Play area — three tap zones */}
      <div
        className="relative overflow-hidden rounded-lg border border-deepblue/15 bg-[#EAF4F2]"
        style={{ aspectRatio: '16/9' }}
      >
        {phase === 'playing' && (
          <div className="absolute inset-0 flex">
            {/* LEFT ZONE */}
            <button
              aria-label="Tap left"
              onClick={() => handleSideTap('left')}
              className="relative flex h-full w-[26%] items-center justify-start pl-3 focus:outline-none"
            >
              {/* Pulse indicator */}
              {activePulse?.side === 'left' && (
                <div
                  className="pointer-events-none absolute w-10 h-10 rounded-full"
                  style={{
                    top: `${activePulse.yPct}%`,
                    left: '20%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#FA961C',
                    boxShadow: '0 0 16px 6px rgba(250,150,28,0.5)',
                  }}
                />
              )}
              {/* Zone hint — very subtle */}
              <span className="font-ui text-[10px] uppercase tracking-widest text-deepblue/25">
                Left
              </span>
            </button>

            {/* CENTRE ZONE */}
            <button
              aria-label={`Tap centre — target is ${targetDigit}`}
              onClick={handleCenterTap}
              className="flex h-full flex-1 flex-col items-center justify-center gap-2 border-x border-deepblue/10 focus:outline-none"
            >
              <span
                className="font-heading tabular-nums"
                style={{
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  lineHeight: 1,
                  color:
                    centralDigit === targetDigit ? '#FA961C' : '#107099',
                }}
              >
                {centralDigit}
              </span>
              <span className="font-ui text-[10px] uppercase tracking-widest text-deepblue/30">
                Tap when {targetDigit}
              </span>
            </button>

            {/* RIGHT ZONE */}
            <button
              aria-label="Tap right"
              onClick={() => handleSideTap('right')}
              className="relative flex h-full w-[26%] items-center justify-end pr-3 focus:outline-none"
            >
              {activePulse?.side === 'right' && (
                <div
                  className="pointer-events-none absolute w-10 h-10 rounded-full"
                  style={{
                    top: `${activePulse.yPct}%`,
                    right: '20%',
                    transform: 'translate(50%, -50%)',
                    backgroundColor: '#FA961C',
                    boxShadow: '0 0 16px 6px rgba(250,150,28,0.5)',
                  }}
                />
              )}
              <span className="font-ui text-[10px] uppercase tracking-widest text-deepblue/25">
                Right
              </span>
            </button>
          </div>
        )}

        {/* Ready overlay */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Peripheral Pulse</h3>
            <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-brown/80">
              Eyes centre. The big digit changes every few seconds — tap the centre area
              when it matches your target. Orange pulses appear left or right: tap that side
              to register them. You can't win by ignoring the centre.
            </p>
            <p className="mt-3 font-ui text-xs text-brown/50">60-second round</p>
            <button onClick={start} className="btn-primary mt-4">
              Start
            </button>
          </div>
        )}

        {/* Over overlay */}
        {phase === 'over' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#EAF4F2]/95 p-6 text-center">
            <h3 className="font-heading text-2xl text-deepblue">Round complete</h3>
            <p className="mt-3 font-heading text-4xl text-deepblue">
              {combined}
              <span className="text-2xl text-deepblue/60">%</span>
            </p>
            <p className="mt-1 font-ui text-xs text-brown/70">
              Peripheral: {finalScore.periphHits}/{finalScore.totalPulses} ({periphHitPct}%)
              · Centre: {finalScore.centralHits}/{finalScore.centralTargets} ({centralHitPct}%)
            </p>
            <p className="mt-3 max-w-xs font-body text-sm italic text-brown/60">{takeaway}</p>
            <div className="mt-1 max-w-sm">
              <SavePrompt isBest={isNewBest} game="peripheral-pulse" />
            </div>
            <button onClick={start} className="btn-primary mt-4">
              Play again
            </button>
          </div>
        )}
      </div>

      {/* Zone labels below the play area */}
      {phase === 'playing' && (
        <div className="mt-1 flex justify-between font-ui text-[10px] uppercase tracking-widest text-brown/35">
          <span className="w-[26%] text-center">← tap pulses here</span>
          <span className="flex-1 text-center">tap digit {targetDigit} here</span>
          <span className="w-[26%] text-center">tap pulses here →</span>
        </div>
      )}
    </div>
  );
}
