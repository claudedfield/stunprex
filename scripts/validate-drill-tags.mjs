/**
 * D-WEB-09 · Build gate for drill metadata.
 *
 * Fails `npm run build` (via prebuild) if any drill's frontmatter carries a
 * conviction id that does not resolve against the pinned Codex Release 1 set
 * (v1.0.1, ids 1–42), or an age band outside the canon B1–B5 set. Every
 * offending file is named, with the offending values.
 *
 * D-WEB-16 extends it with the Codex provenance field: a drill must declare
 * which Codex release its conviction numbers speak.
 *
 * The valid sets are read from the vendored, canon-generated sources —
 * lib/codex/release1.ts and lib/types/drill.ts — so this gate cannot drift
 * from what the app itself considers valid.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..');

// `--drills <dir>` points the gate at a fixture directory instead of the real
// corpus. Used by the test that proves the gate bites. In fixture mode the
// blog-post scan is skipped, since fixtures carry no posts.
const dirFlag = process.argv.indexOf('--drills');
const FIXTURE_MODE = dirFlag > -1;
const DRILLS = FIXTURE_MODE
  ? path.resolve(process.argv[dirFlag + 1])
  : path.resolve(REPO, 'content/drills');

// Read the pinned sets straight out of the TS sources (no build step needed).
const release1 = fs.readFileSync(path.join(REPO, 'lib/codex/release1.ts'), 'utf8');
const VALID_CONVICTIONS = new Set(
  [...release1.matchAll(/^\s*(\d+):\s*"/gm)].map((m) => Number(m[1])),
);

const drillTypes = fs.readFileSync(path.join(REPO, 'lib/types/drill.ts'), 'utf8');
const bandsBlock = drillTypes.match(/export const AGE_BANDS:[^=]*=\s*\[([^\]]*)\]/);
const VALID_BANDS = new Set(
  [...(bandsBlock?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]),
);

// ── Codex provenance (D-WEB-16) ─────────────────────────────────────────────
// Which Codex release a drill's `convictions` numbers speak. The legacy 1-36
// set and Release 1's 1-42 set overlap, so a range check alone cannot tell a
// Release 1 drill from a legacy one: legacy 36 was retired into Conviction 20,
// while Release 1 carries its own, different, Conviction 36. A range check
// passes both silently, so the file has to name its namespace.
//
// A future Release 2 ADDS 'R2' to this set. It does not replace 'R1': drills
// already numbered against Release 1 stay valid, and the field is what tells
// the two apart.
const ALLOWED_CODEX_RELEASES = new Set(['R1']);

if (VALID_CONVICTIONS.size === 0 || VALID_BANDS.size === 0) {
  console.error('[drill-tags] FATAL: could not read the pinned conviction or age-band sets.');
  process.exit(1);
}

const problems = [];
const files = fs.readdirSync(DRILLS).filter((f) => f.endsWith('.mdx')).sort();

for (const file of files) {
  const text = fs.readFileSync(path.join(DRILLS, file), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!fm) { problems.push(`${file}: no frontmatter block`); continue; }

  // ── codex provenance ─────────────────────────────────────────────────────
  const rel = fm
    .match(/^codex_release:[ \t]*(.*?)[ \t]*$/m)?.[1]
    ?.replace(/^["']|["']$/g, '');
  if (!rel) {
    problems.push(`${file}: missing codex_release`);
  } else if (!ALLOWED_CODEX_RELEASES.has(rel)) {
    problems.push(`${file}: unknown codex_release: ${rel}`);
  }

  // ── convictions ──────────────────────────────────────────────────────────
  const cInline = fm.match(/^convictions:[ \t]*\[([^\]]*)\]/m);
  const cBlock = fm.match(/^convictions:[ \t]*\n((?:[ \t]*-[ \t]*.+\n?)+)/m);
  if (!cInline && !cBlock) {
    problems.push(`${file}: missing required "convictions:" frontmatter`);
  } else {
    const raw = cInline
      ? cInline[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [...cBlock[1].matchAll(/^[ \t]*-[ \t]*(.+?)[ \t]*$/gm)].map((m) => m[1]);
    const bad = raw.filter((v) => !/^\d+$/.test(v) || !VALID_CONVICTIONS.has(Number(v)));
    if (bad.length) {
      problems.push(
        `${file}: conviction id(s) not in Codex Release 1 (v1.0.1, 1–42): ${bad.join(', ')}`,
      );
    }
  }

  // ── age bands ────────────────────────────────────────────────────────────
  const bInline = fm.match(/^ageBand:[ \t]*\[([^\]]*)\]/m);
  const bBlock = fm.match(/^ageBand:[ \t]*\n((?:[ \t]*-[ \t]*.+\n?)+)/m);
  if (!bInline && !bBlock) {
    problems.push(`${file}: missing required "ageBand:" frontmatter`);
  } else {
    const raw = bInline
      ? bInline[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [...bBlock[1].matchAll(/^[ \t]*-[ \t]*(.+?)[ \t]*$/gm)].map((m) => m[1]);
    const bad = raw
      .map((s) => s.replace(/^["']|["']$/g, ''))
      .filter((v) => !VALID_BANDS.has(v));
    if (bad.length) {
      problems.push(`${file}: age band(s) outside canon B1–B5: ${bad.join(', ')}`);
    }
  }
}

// ── Blog posts: codexAnchors.convictions use the same identifier space ───────
// Plus the em-dash rule (owner rule, 6 September 2026). It was dated at first,
// because the eleven June posts carried 279 em-dashes between them and a blanket
// rule would have failed the build on history. D-WEB-20 cleared all of them, so
// the gate now applies to every post with no exemption: there is no longer any
// history to protect, and a date window would quietly let the June corpus
// regress.
const POSTS = path.resolve(REPO, 'content/posts');
for (const file of FIXTURE_MODE ? [] :  fs.readdirSync(POSTS).filter((f) => f.endsWith('.mdx')).sort()) {
  const text = fs.readFileSync(path.join(POSTS, file), 'utf8');
  {
    // Whole file, not just the body: a title or description is the visible
    // surface and is exactly where D-WEB-20 found them.
    const n = (text.match(/\u2014/g) ?? []).length;
    if (n) {
      problems.push(`posts/${file}: ${n} em-dash(es); the owner rule of 6 Sep 2026 allows none`);
    }
  }

  const m = text.match(/^codexAnchors:\s*\n\s*convictions:[ \t]*\[([^\]]*)\]/m);
  if (!m) continue;
  const bad = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v) => !/^\d+$/.test(v) || !VALID_CONVICTIONS.has(Number(v)));
  if (bad.length) {
    problems.push(
      `posts/${file}: conviction id(s) not in Codex Release 1 (v1.0.1, 1–42): ${bad.join(', ')}`,
    );
  }
}

if (problems.length) {
  console.error(`\n[drill-tags] BUILD FAILED — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error(
    `\nValid conviction ids: 1–42 (Codex Release 1, set v1.0.1).` +
      `\nValid age bands: ${[...VALID_BANDS].join(', ')}` +
      `\nValid codex_release values: ${[...ALLOWED_CODEX_RELEASES].join(', ')}\n`,
  );
  process.exit(1);
}

console.log(
  `[drill-tags] OK — ${files.length} drills${FIXTURE_MODE ? '' : ' + blog codexAnchors'} validated against ` +
    `${VALID_CONVICTIONS.size} Codex Release 1 conviction ids, ${VALID_BANDS.size} canon age bands ` +
    `and codex_release in {${[...ALLOWED_CODEX_RELEASES].join(', ')}}.`,
);
