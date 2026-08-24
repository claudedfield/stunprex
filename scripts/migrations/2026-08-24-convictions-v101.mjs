/**
 * D-WEB-09 · One-shot migration: legacy conviction numbers → Codex Release 1
 * (conviction set v1.0.1, 24 Aug 2026) identifiers.
 *
 * The legacy→new table is PARSED from the canon crosswalk at
 * Codex_Volumes/_registry/id_crosswalk.md — never hand-transcribed — so the
 * migration cannot drift from canon. Mechanical only: no per-drill judgement.
 *
 * SAFETY — this migration is NOT idempotent by nature: most new ids (1–36) are
 * also valid legacy ids, so re-running would silently corrupt already-migrated
 * files (new 20 would be re-read as legacy 20 → new 4). A per-file check cannot
 * detect this reliably, because a migrated file whose ids all land ≤36 is
 * indistinguishable from a legacy one. So each corpus is guarded AS A WHOLE:
 * if any file in it holds an id in 37–42 (unreachable under legacy numbering)
 * the corpus has already been migrated and is left untouched.
 *
 * Run:  node scripts/migrations/2026-08-24-convictions-v101.mjs [--apply]
 * Without --apply it is a dry run and writes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../..');
const CROSSWALK = path.resolve(REPO, '../Codex_Volumes/_registry/id_crosswalk.md');
const APPLY = process.argv.includes('--apply');

// ── Build legacy → new from canon ────────────────────────────────────────────
const rows = [...fs.readFileSync(CROSSWALK, 'utf8').matchAll(
  /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm,
)];
const legacyToNew = new Map();
for (const [, newIdRaw, , legacyRaw] of rows) {
  for (const n of legacyRaw.matchAll(/\d+/g)) legacyToNew.set(Number(n[0]), Number(newIdRaw));
}

// treasure-doors.mdx stored conviction TITLES as strings (pre-existing schema
// violation — the type declares number[]). Resolved mechanically: exact match
// against the LEGACY title list (StunpreX_Codex_v0.8_Contents.md), then the
// crosswalk. "Free play is protected" is a paraphrase resolved by uniqueness —
// exactly one conviction in either set concerns free play (legacy 7 → new 25).
const TITLE_TO_LEGACY = new Map([
  ['First touch is the foundation skill', 4],
  ['Scanning is a habit, not a gift', 5],
  ['The first habits set deepest', 32],
  ['Both feet, or half a player', 6],
  ['Free play is protected', 7],
  ['Constraints generate creativity', 13],
]);

const mapOne = (v) => {
  if (typeof v === 'number') {
    if (!legacyToNew.has(v)) throw new Error(`legacy id ${v} not in crosswalk`);
    return legacyToNew.get(v);
  }
  const legacy = TITLE_TO_LEGACY.get(v);
  if (legacy === undefined) throw new Error(`unmapped title string: "${v}"`);
  return legacyToNew.get(legacy);
};

const parseVals = (raw) =>
  raw.map((s) => (/^\d+$/.test(s) ? Number(s) : s.replace(/^["']|["']$/g, '')));

/** Read every conviction list in a corpus: [{file, vals, replace(newVals)}]. */
function readCorpus(dir, pattern) {
  const out = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
    const full = path.join(dir, file);
    const text = fs.readFileSync(full, 'utf8');
    const m = text.match(pattern.inline);
    const b = pattern.block ? text.match(pattern.block) : null;
    if (m) {
      const vals = parseVals(m[2].split(',').map((s) => s.trim()).filter(Boolean));
      out.push({ file, full, text, vals, build: (nv) => text.replace(m[0], `${m[1]}${nv.join(', ')}${m[3]}`) });
    } else if (b) {
      const vals = parseVals([...b[2].matchAll(/^[ \t]*-[ \t]*(.+?)[ \t]*$/gm)].map((x) => x[1]));
      const indent = (b[2].match(/^([ \t]*)-/) || [, '  '])[1];
      out.push({
        file, full, text, vals,
        build: (nv) => text.replace(b[0], `${b[1]}\n${nv.map((n) => `${indent}- ${n}`).join('\n')}\n`),
      });
    }
  }
  return out;
}

function migrate(label, dir, pattern) {
  const corpus = readCorpus(dir, pattern);
  if (corpus.length === 0) { console.log(`\n${label}: no files matched.`); return; }

  const migrated = corpus.filter((e) => e.vals.some((v) => typeof v === 'number' && v >= 37));
  if (migrated.length > 0) {
    console.log(
      `\n${label}: ALREADY MIGRATED — ${migrated.length}/${corpus.length} file(s) hold ids ≥37, ` +
      `unreachable under legacy numbering. Corpus left untouched (re-running would corrupt it).`,
    );
    return;
  }

  let changed = 0, tags = 0;
  console.log(`\n${label}: ${corpus.length} file(s)`);
  for (const e of corpus) {
    const nv = [...new Set(e.vals.map(mapOne))].sort((a, b) => a - b);
    tags += e.vals.length;
    const out = e.build(nv);
    if (out !== e.text) { changed++; if (APPLY) fs.writeFileSync(e.full, out, 'utf8'); }
    console.log(`  ${e.file}: ${JSON.stringify(e.vals)} -> ${JSON.stringify(nv)}`);
  }
  console.log(
    `  → ${changed} file(s) ${APPLY ? 'written' : 'would change'}; ` +
    `${tags} legacy tag instance(s) re-mapped.`,
  );
}

console.log(`crosswalk rows: ${rows.length}   mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
console.log('legacy → new:', [...legacyToNew.entries()].sort((a, b) => a[0] - b[0])
  .map(([l, n]) => `${l}→${n}`).join('  '));

migrate('drills (content/drills · convictions:)', path.resolve(REPO, 'content/drills'), {
  inline: /^(convictions:[ \t]*\[)([^\]]*)(\])/m,
  block: /^(convictions:)[ \t]*\n((?:[ \t]*-[ \t]*.+\n?)+)/m,
});

migrate('posts (content/posts · codexAnchors.convictions:)', path.resolve(REPO, 'content/posts'), {
  inline: /^(codexAnchors:\s*\n\s*convictions:[ \t]*\[)([^\]]*)(\])/m,
});
