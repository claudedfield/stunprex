// DrillMetaPanel — metadata panel for drill detail pages.
// variant="mobile"  → collapsible card above body (lg:hidden)
// variant="desktop" → sticky right-rail panel (shown always; parent controls lg:block)
// No variant (default) → renders BOTH; for use outside a grid layout.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CapacityChips } from './CapacityChips';
import { DifficultyDots } from './DifficultyDots';
import type { DrillFrontmatter } from '@/lib/types/drill';

interface Props {
  frontmatter: DrillFrontmatter;
  variant?: 'mobile' | 'desktop';
}

/** Map a frontmatter ageBand string (e.g. "9–12 Foundation") to a URL slug (e.g. "9-12"). */
function ageBandStringToSlug(value: string): string | null {
  if (value.includes('5–8')) return '5-8';
  if (value.includes('9–12')) return '9-12';
  if (value.includes('13–16')) return '13-16';
  if (value.includes('17–20')) return '17-20';
  if (/adult/i.test(value)) return 'adult';
  return null;
}

interface AgeBandValueProps {
  label: string;
  value: string;
}

function AgeBandValue({ label, value }: AgeBandValueProps) {
  const slug = ageBandStringToSlug(value);
  return (
    <div>
      <span className="text-brown/50 font-ui text-xs">{label}: </span>
      {slug ? (
        <Link
          href={`/age-bands/${slug}`}
          className="text-brown/75 font-body hover:text-deepblue transition-colors"
        >
          {value}
        </Link>
      ) : (
        <span className="text-brown/75 font-body">{value}</span>
      )}
    </div>
  );
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
        <dd className="space-y-0.5">
          {ageBand.introducible && (
            <AgeBandValue label="Introducible" value={ageBand.introducible} />
          )}
          {ageBand.central && (
            <AgeBandValue label="Central" value={ageBand.central} />
          )}
          {ageBand.maintenance && (
            <AgeBandValue label="Maintenance" value={ageBand.maintenance} />
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
