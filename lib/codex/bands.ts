/**
 * Codex Release 1 — age bands B1–B5.
 *
 * Canon (Volume 2 §10, owner decision 23 Aug 2026): "the legacy bands win" —
 * B1 · 5–8 Discovery · B2 · 9–12 Foundation · B3 · 13–16 Development ·
 * B4 · 17–20 Specialisation · B5 · 21+ Mastery. The site's existing AgeBand
 * ranges already match canon exactly, so no re-tagging was required; what was
 * missing were the band NAMES.
 *
 * Vol 2 §10: "The band names carry the pedagogy; the age ranges carry only the
 * typical window. Where a downstream surface publishes numeric ranges without
 * names, the pedagogy is invisible and the surface is incomplete." These labels
 * close that gap.
 *
 * U-NOTATION: aliases only, for discoverability (LA-01 — the market searches
 * "U10"/"U12" while the site published numeric ranges only). Canon rejected
 * U-notation as the BAND SCHEME; these are search/display aliases for the
 * decided chronological bands, not a competing scheme. The pairing follows how
 * Vol 2 §10 itself lines the two schemes up.
 */
import type { AgeBand } from '@/lib/types/drill';

export interface AgeBandMeta {
  /** Canon band identifier. */
  id: 'B1' | 'B2' | 'B3' | 'B4' | 'B5';
  /** The frontmatter/tag value. */
  band: AgeBand;
  /** Canon band name — carries the pedagogy. */
  name: string;
  /** Age range for display (en-dash). */
  range: string;
  /** U-notation aliases; empty for the senior band, where U-notation has no meaning. */
  uTokens: string[];
  /** Compact U-range for display, or null. */
  uRange: string | null;
}

export const AGE_BAND_META: readonly AgeBandMeta[] = [
  { id: 'B1', band: '5-8',   name: 'Discovery',      range: '5–8',   uTokens: ['U5', 'U6', 'U7', 'U8'],      uRange: 'U5–U8' },
  { id: 'B2', band: '9-12',  name: 'Foundation',     range: '9–12',  uTokens: ['U9', 'U10', 'U11', 'U12'],   uRange: 'U9–U12' },
  { id: 'B3', band: '13-16', name: 'Development',    range: '13–16', uTokens: ['U13', 'U14', 'U15', 'U16'],  uRange: 'U13–U16' },
  { id: 'B4', band: '17-20', name: 'Specialisation', range: '17–20', uTokens: ['U17', 'U18', 'U19', 'U20'],  uRange: 'U17–U20' },
  { id: 'B5', band: '21+',   name: 'Mastery',        range: '21+',   uTokens: [],                            uRange: null },
];

const BY_BAND = new Map(AGE_BAND_META.map((b) => [b.band, b]));

export function bandMeta(band: AgeBand): AgeBandMeta | undefined {
  return BY_BAND.get(band);
}

/** Filter-chip / label text: "9–12 · Foundation (U9–U12)". */
export function bandLabel(band: AgeBand): string {
  const m = BY_BAND.get(band);
  if (!m) return band;
  return m.uRange ? `${m.range} · ${m.name} (${m.uRange})` : `${m.range} · ${m.name}`;
}

/** Compact label without U-notation: "9–12 · Foundation". */
export function bandLabelShort(band: AgeBand): string {
  const m = BY_BAND.get(band);
  return m ? `${m.range} · ${m.name}` : band;
}

/**
 * Resolve a free-text query to the bands it names — so "U10" or "u12" matches
 * the 9–12 band, and "Foundation" matches it too. Returns [] when the query
 * names no band.
 */
export function bandsMatchingQuery(query: string): AgeBand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return AGE_BAND_META.filter(
    (m) =>
      m.uTokens.some((u) => u.toLowerCase() === q) ||
      m.name.toLowerCase() === q ||
      m.id.toLowerCase() === q,
  ).map((m) => m.band);
}
