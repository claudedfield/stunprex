// DrillMetaPanel — metadata panel for drill detail pages.
// variant="mobile"  → collapsible card above body (lg:hidden)
// variant="desktop" → sticky right-rail panel (shown always; parent controls lg:block)
// No variant (default) → renders BOTH; for use outside a grid layout.
'use client';

import { useState } from 'react';
import { CapacityChips } from './CapacityChips';
import { DifficultyDots } from './DifficultyDots';
import type { DrillFrontmatter } from '@/lib/types/drill';

interface Props {
  frontmatter: DrillFrontmatter;
  variant?: 'mobile' | 'desktop';
}

export function DrillMetaPanel({ frontmatter, variant }: Props) {
  const [open, setOpen] = useState(false);
  const { codexAnchors, ageBand, players, duration, equipment, difficulty } = frontmatter;

  const content = (
    <dl className="grid gap-3 text-sm">
      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Capacities trained
        </dt>
        <dd>
          <CapacityChips
            primary={codexAnchors.capacities.primary}
            secondary={codexAnchors.capacities.secondary}
          />
        </dd>
      </div>

      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Age band
        </dt>
        <dd className="space-y-0.5 text-brown/75 font-body">
          {ageBand.introducible && (
            <div>
              <span className="text-brown/50 font-ui text-xs">Introducible: </span>
              {ageBand.introducible}
            </div>
          )}
          {ageBand.central && (
            <div>
              <span className="text-brown/50 font-ui text-xs">Central: </span>
              {ageBand.central}
            </div>
          )}
          {ageBand.maintenance && (
            <div>
              <span className="text-brown/50 font-ui text-xs">Maintenance: </span>
              {ageBand.maintenance}
            </div>
          )}
        </dd>
      </div>

      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Players
        </dt>
        <dd className="text-brown/75 font-body">{players}</dd>
      </div>

      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Duration
        </dt>
        <dd className="text-brown/75 font-body">{duration}</dd>
      </div>

      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Equipment
        </dt>
        <dd>
          <ul className="space-y-0.5">
            {equipment.map((item) => (
              <li key={item} className="text-brown/75 font-body">
                {item}
              </li>
            ))}
          </ul>
        </dd>
      </div>

      <div>
        <dt className="text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui mb-1">
          Difficulty
        </dt>
        <dd>
          <DifficultyDots baseline={difficulty.baseline} elite={difficulty.elite} />
        </dd>
      </div>
    </dl>
  );

  // Mobile-only collapsible card
  const mobilePanel = (
    <div className="mb-8 rounded-xl border border-deepblue/10 bg-white/80 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-deepblue font-ui"
        aria-expanded={open}
      >
        Drill details
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{content}</div>}
    </div>
  );

  // Desktop always-visible card (parent controls visibility)
  const desktopPanel = (
    <div className="rounded-xl border border-deepblue/10 bg-white/80 p-6 sticky top-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brown/50 font-ui">
        Drill details
      </p>
      {content}
    </div>
  );

  if (variant === 'mobile') return mobilePanel;
  if (variant === 'desktop') return desktopPanel;

  // Default: both, with CSS show/hide
  return (
    <>
      <div className="lg:hidden">{mobilePanel}</div>
      <div className="hidden lg:block">{desktopPanel}</div>
    </>
  );
}
