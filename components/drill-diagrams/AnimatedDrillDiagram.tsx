'use client';

/**
 * AnimatedDrillDiagram — brings a drill diagram to life.
 *
 * Reads the animation spec (stable `entities` + timed `steps`) and interpolates
 * entity positions across steps via requestAnimationFrame with ease-in-out.
 * Reuses the static diagram primitives (Pitch/Cone/Player/Ball/Zone/Label) and
 * brand tokens so animated and static diagrams look identical at rest.
 *
 * Movement semantics (Drill Animation System v1 §1):
 *   - `attachedTo` makes an entity (the ball) follow another entity each frame.
 *   - a step `move` with `to` snaps/travels to an entity id or an {x,y}; an explicit
 *     `to` detaches a previously-attached entity for the duration of that travel.
 *   - a step `move` with `attachedTo` (re-)parents an entity to follow another.
 *   - `moves: []` is a held beat (e.g. a scan).
 *
 * Controls: play/pause, restart, a timeline scrubber, and the current-step caption.
 * Pauses when offscreen (IntersectionObserver) for perf.
 *
 * Reduced-motion: if `prefers-reduced-motion: reduce`, renders the final state
 * statically with the step captions as an ordered list — full information, no motion.
 *
 * Fallback ladder (in the drill page): animation → static diagram → prose setup.
 * Part of Style System v1 §6.6 + Drill Animation System v1.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnimatedEntity, AnimationSpec, PitchSize, Point } from './types';
import { PitchSmallBackground, PITCH_SMALL_VIEWBOX } from './PitchSmall';
import { PitchHalfBackground, PITCH_HALF_VIEWBOX } from './PitchHalf';
import { PitchFullBackground, PITCH_FULL_VIEWBOX } from './PitchFull';
import { Cone } from './Cone';
import { Player } from './Player';
import { Ball } from './Ball';
import { Zone } from './Zone';
import { Label } from './Label';

const VIEWBOX: Record<PitchSize, string> = {
  small: PITCH_SMALL_VIEWBOX,
  half: PITCH_HALF_VIEWBOX,
  full: PITCH_FULL_VIEWBOX,
};

// ─── Interpolation maths ─────────────────────────────────────────────────────

type PosMap = Record<string, Point>;

/** Per-step anchor: where every entity sits at the start and end, plus which entities follow another. */
interface Frame {
  start: PosMap;
  end: PosMap;
  /** entityId → the id it tracks live this step (no explicit `to` given). */
  followers: Record<string, string>;
}

/** Hold the final frame this long before re-looping, so each rep reads as one complete rep (§6 decision #1). */
const LOOP_HOLD_MS = 1000;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Smooth ease-in-out (quadratic). */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const lerpPt = (a: Point, b: Point, e: number): Point => ({
  x: a.x + (b.x - a.x) * e,
  y: a.y + (b.y - a.y) * e,
});

/**
 * Precompute the per-step start/end anchors from the entity list + steps.
 * Pure: runs once per (entities, steps) via useMemo.
 */
function buildFrames(entities: AnimatedEntity[], steps: AnimationSpec['steps']): Frame[] {
  // Initial positions + attachments.
  const initial: PosMap = {};
  const attach: Record<string, string | null> = {};
  for (const e of entities) {
    initial[e.id] = { x: e.x, y: e.y };
    if (e.attachedTo) attach[e.id] = e.attachedTo;
  }
  // Resolve initial followers to their target's position.
  for (const id of Object.keys(attach)) {
    const tgt = attach[id];
    if (tgt && initial[tgt]) initial[id] = { ...initial[tgt] };
  }

  const frames: Frame[] = [];
  let prevEnd: PosMap = initial;
  let curAttach = { ...attach };

  for (const step of steps) {
    const start: PosMap = {};
    for (const id of Object.keys(prevEnd)) start[id] = { ...prevEnd[id] };

    const nextAttach = { ...curAttach };
    // explicit[id] = a coordinate {x,y} or a reference {ref:id}
    const explicit: Record<string, Point | { ref: string }> = {};

    for (const m of step.moves ?? []) {
      if (m.to !== undefined) {
        nextAttach[m.id] = null; // an explicit positional move detaches
        explicit[m.id] =
          typeof m.to === 'object' ? { x: m.to.x, y: m.to.y } : { ref: m.to };
      }
      if (m.attachedTo !== undefined) {
        nextAttach[m.id] = m.attachedTo;
      }
    }

    // End anchors: default everyone stays where they started.
    const end: PosMap = {};
    for (const id of Object.keys(start)) end[id] = { ...start[id] };

    // Coordinate moves.
    for (const id of Object.keys(explicit)) {
      const ex = explicit[id];
      if ('x' in ex) end[id] = { x: ex.x, y: ex.y };
    }
    // Reference moves — snap to the target's END position (handles simultaneous motion),
    // falling back to its start, then to the mover's own start.
    for (const id of Object.keys(explicit)) {
      const ex = explicit[id];
      if ('ref' in ex) {
        const tgt = ex.ref;
        end[id] = end[tgt] ? { ...end[tgt] } : start[tgt] ? { ...start[tgt] } : { ...start[id] };
      }
    }

    // Followers: attached this step and not given an explicit `to` — they track their target.
    const followers: Record<string, string> = {};
    for (const id of Object.keys(nextAttach)) {
      const tgt = nextAttach[id];
      if (tgt && !explicit[id]) {
        followers[id] = tgt;
        if (start[tgt]) start[id] = { ...start[tgt] };
        end[id] = end[tgt] ? { ...end[tgt] } : start[tgt] ? { ...start[tgt] } : { ...(start[id] ?? { x: 0, y: 0 }) };
      }
    }

    frames.push({ start, end, followers });
    prevEnd = end;
    curAttach = nextAttach;
  }

  return frames;
}

/** Resolve every entity's position at (stepIndex, t∈[0,1]). */
function resolveFrame(frames: Frame[], stepIndex: number, t: number): PosMap {
  const f = frames[stepIndex];
  if (!f) return {};
  const e = ease(clamp01(t));
  const pos: PosMap = {};
  // Non-followers first (so followers can read their live position).
  for (const id of Object.keys(f.start)) {
    if (!f.followers[id]) pos[id] = lerpPt(f.start[id], f.end[id], e);
  }
  for (const id of Object.keys(f.followers)) {
    const tgt = f.followers[id];
    pos[id] = pos[tgt] ? { ...pos[tgt] } : lerpPt(f.start[id], f.end[id], e);
  }
  return pos;
}

/** Map a global elapsed time (ms) to its step index + local t. */
function locate(elapsed: number, steps: AnimationSpec['steps']): { stepIndex: number; t: number } {
  let acc = 0;
  for (let i = 0; i < steps.length; i++) {
    const d = steps[i].duration;
    if (elapsed < acc + d || i === steps.length - 1) {
      return { stepIndex: i, t: d > 0 ? clamp01((elapsed - acc) / d) : 1 };
    }
    acc += d;
  }
  return { stepIndex: 0, t: 0 };
}

// ─── Entity rendering ────────────────────────────────────────────────────────

/** Render one entity at a resolved position, mapping to its static primitive. */
function renderEntity(e: AnimatedEntity, p: Point) {
  switch (e.type) {
    case 'player':
      return <Player key={e.id} type="player" x={p.x} y={p.y} team={e.team ?? 'home'} id={e.label} />;
    case 'ball':
      return <Ball key={e.id} type="ball" x={p.x} y={p.y} state={e.state} />;
    case 'cone':
      return <Cone key={e.id} type="cone" x={p.x} y={p.y} color={e.color} label={e.label} />;
    case 'zone':
      return (
        <Zone
          key={e.id}
          type="zone"
          x={p.x}
          y={p.y}
          width={e.width ?? 0}
          height={e.height ?? 0}
          label={e.label}
        />
      );
    case 'label':
      return <Label key={e.id} type="label" x={p.x} y={p.y} text={e.label ?? ''} />;
    default:
      return null;
  }
}

// ─── Control icons (inline SVG, currentColor) ────────────────────────────────

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);
const RestartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────────────────────

export interface AnimatedDrillDiagramProps {
  pitch: PitchSize;
  entities: AnimatedEntity[];
  animation: AnimationSpec;
  /** Optional title rendered above the SVG. */
  title?: string;
  /** Optional caption rendered below the controls. */
  caption?: string;
}

export function AnimatedDrillDiagram({
  pitch,
  entities,
  animation,
  title,
  caption,
}: AnimatedDrillDiagramProps) {
  const steps = animation.steps ?? [];
  const loop = animation.loop ?? false;
  const viewBox = VIEWBOX[pitch];

  const frames = useMemo(() => buildFrames(entities, steps), [entities, animation]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = useMemo(() => steps.reduce((s, st) => s + st.duration, 0), [animation]); // eslint-disable-line react-hooks/exhaustive-deps

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true); // autoplay once visible
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  const elapsedRef = useRef(0);
  const containerRef = useRef<HTMLElement>(null);

  // Detect reduced-motion preference (after mount → no hydration mismatch).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Pause when offscreen (perf).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The rAF loop — only runs while playing, visible, motion allowed, and there's a timeline.
  useEffect(() => {
    if (reduced || !playing || !inView || total <= 0 || steps.length === 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      let next = elapsedRef.current + dt;
      // When looping, run past `total` by LOOP_HOLD_MS holding the final frame, then restart.
      const wrapAt = total + (loop ? LOOP_HOLD_MS : 0);
      if (next >= wrapAt) {
        if (loop) {
          next = 0; // restart after the end-of-rep hold
        } else {
          elapsedRef.current = total;
          setElapsed(total);
          setPlaying(false);
          return;
        }
      }
      elapsedRef.current = next;
      setElapsed(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, playing, inView, total, loop, steps.length]);

  // Derived frame. Clamp to `total` so the end-of-rep hold (elapsed in [total, total+hold]) shows the final frame.
  const atEnd = elapsed >= total && !loop;
  const { stepIndex, t } = locate(reduced ? total : Math.min(elapsed, total), steps);
  const positions = resolveFrame(frames, stepIndex, t);
  const activeCaption = steps[stepIndex]?.caption ?? '';

  const togglePlay = () => {
    if (!playing && atEnd) {
      elapsedRef.current = 0;
      setElapsed(0);
    }
    setPlaying((p) => !p);
  };
  const restart = () => {
    elapsedRef.current = 0;
    setElapsed(0);
    setPlaying(true);
  };
  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    elapsedRef.current = v;
    setElapsed(v);
    setPlaying(false); // scrubbing pauses playback
  };

  // The SVG scene (shared by animated + reduced-motion render).
  const scene = (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={title ?? 'Animated drill diagram'}
      className="w-full max-w-[480px] block mx-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {pitch === 'small' && <PitchSmallBackground />}
      {pitch === 'half' && <PitchHalfBackground />}
      {pitch === 'full' && <PitchFullBackground />}
      {entities.map((e) => renderEntity(e, positions[e.id] ?? { x: e.x, y: e.y }))}
    </svg>
  );

  // ── Reduced-motion: final state + ordered caption list, no controls/motion. ──
  if (reduced) {
    return (
      <figure
        ref={containerRef}
        className="not-prose my-6 overflow-hidden rounded-lg border border-deepblue/15 bg-white"
      >
        {title && (
          <p className="px-4 pt-3 pb-1 font-ui text-[10px] uppercase tracking-widest text-brown/60">
            {title}
          </p>
        )}
        <div className="px-3 pb-3">{scene}</div>
        <figcaption className="px-4 pb-4 font-body text-xs text-brown/70 leading-snug">
          {caption && <p className="italic mb-2">{caption}</p>}
          <p className="font-ui text-[10px] uppercase tracking-widest text-brown/50 mb-1.5">
            Sequence
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="text-brown/80">
                {s.caption}
              </li>
            ))}
          </ol>
        </figcaption>
      </figure>
    );
  }

  // ── Animated render. ─────────────────────────────────────────────────────
  return (
    <figure
      ref={containerRef}
      className="not-prose my-6 overflow-hidden rounded-lg border border-deepblue/15 bg-white"
    >
      {title && (
        <p className="px-4 pt-3 pb-1 font-ui text-[10px] uppercase tracking-widest text-brown/60">
          {title}
        </p>
      )}

      <div className="px-3 pb-2">{scene}</div>

      {/* Controls */}
      <div className="flex items-center gap-2.5 px-4 pb-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause animation' : atEnd ? 'Replay animation' : 'Play animation'}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-deepblue/25 text-deepblue hover:bg-deepblue/5 transition-colors"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          onClick={restart}
          aria-label="Restart animation"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-deepblue/25 text-deepblue hover:bg-deepblue/5 transition-colors"
        >
          <RestartIcon />
        </button>

        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={Math.min(elapsed, total)}
          onChange={onScrub}
          aria-label="Scrub drill steps"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-deepblue/15 accent-orange"
        />

        <span className="shrink-0 font-ui text-[10px] tabular-nums uppercase tracking-widest text-brown/50">
          {stepIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Current-step caption (live region) */}
      <figcaption className="px-4 pb-3 font-body text-xs text-brown/80 leading-snug min-h-[2.5em]">
        <span aria-live="polite" className="block">
          <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-orange mr-1.5">
            Step {stepIndex + 1}
          </span>
          {activeCaption}
        </span>
        {caption && <span className="mt-1 block italic text-brown/55">{caption}</span>}
      </figcaption>
    </figure>
  );
}
