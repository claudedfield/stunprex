/**
 * D-WEB-22 · Content lint. Fails the build on copy defects in any post or drill.
 *
 * WHY THIS EXISTS: the D-WEB-20 Phase B pass replaced spans by matching word
 * tokens and absorbed only a trailing ./!/?, so a replacement carrying its own
 * punctuation or bold markers doubled against what was already in the file. That
 * shipped 26 visible defects across seven live posts before anyone saw them, and
 * a metadata gate cannot catch a rendering scar. This can.
 *
 * The pattern list lives in content-lint-patterns.mjs so a future mechanical
 * pass can extend it in the same commit that risks a new defect shape.
 *
 *   node scripts/content-lint.mjs                 → the real corpus and UI scope
 *   node scripts/content-lint.mjs --dir <path>    → one MDX fixture directory only
 *   node scripts/content-lint.mjs --ui <file>     → one UI source fixture only (D-WEB-23)
 *   node scripts/content-lint.mjs --pages <path>  → one page-content fixture directory only (D-WEB-24)
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATTERNS, unmatchedBold, UI_SCOPE, emDashesInStrings } from './content-lint-patterns.mjs';

const REPO = path.resolve(import.meta.dirname, '..');
// A fixture flag narrows the run to that fixture alone, so fixture tests never
// depend on the state of the real corpus or the real UI files.
const flag = process.argv.indexOf('--dir');
const uiFlag = process.argv.indexOf('--ui');
const pagesFlag = process.argv.indexOf('--pages');
const FIXTURE = flag > -1 || uiFlag > -1 || pagesFlag > -1;
const DIRS =
  flag > -1
    ? [path.resolve(process.argv[flag + 1])]
    : FIXTURE
      ? []
      : [path.join(REPO, 'content/posts'), path.join(REPO, 'content/drills'), path.join(REPO, 'content/pages')];
// Pages built from a text of record (D-WEB-24) carry no em-dash anywhere, body included.
const PAGE_DIRS = pagesFlag > -1 ? [path.resolve(process.argv[pagesFlag + 1])] : FIXTURE ? [] : [path.join(REPO, 'content/pages')];

/** Expand UI_SCOPE; a trailing slash means every .ts or .tsx file under it. */
function uiFiles() {
  if (uiFlag > -1) return [path.resolve(process.argv[uiFlag + 1])];
  if (FIXTURE) return [];
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name)) out.push(full);
    }
  };
  for (const entry of UI_SCOPE) {
    const full = path.join(REPO, entry);
    if (entry.endsWith('/')) walk(full);
    else out.push(full);
  }
  return out.sort();
}

const problems = [];
let files = 0;

for (const dir of DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
    const full = path.join(dir, file);
    const text = fs.readFileSync(full, 'utf8');
    files += 1;

    for (const { label, re, why } of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const line = text.slice(0, m.index).split('\n').length;
        problems.push({ file, line, label, why });
      }
    }
    for (const { line, text: snippet } of unmatchedBold(text)) {
      problems.push({
        file,
        line,
        label: 'unmatched bold marker',
        why: `An odd number of ** on the line, so one is visible in the rendered page: "${snippet}"`,
      });
    }
  }
}

for (const dir of PAGE_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
    fs.readFileSync(path.join(dir, file), 'utf8')
      .split('\n')
      .forEach((text, i) => {
        if (!text.includes('\u2014')) return;
        problems.push({
          file,
          line: i + 1,
          label: 'em-dash in page content',
          why: 'A page built from a text of record shows every character; fix the text of record, then sync again.',
        });
      });
  }
}

// UI source (D-WEB-23): em-dashes in user-visible strings. Comments are skipped.
for (const full of uiFiles()) {
  const rel = path.relative(REPO, full);
  if (!fs.existsSync(full)) {
    problems.push({
      file: rel,
      line: 0,
      label: 'UI scope file missing',
      why: 'A path in UI_SCOPE does not exist. Fix the scope; a missing file must not pass silently.',
    });
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  files += 1;
  for (const { line, text: snippet } of emDashesInStrings(text)) {
    problems.push({
      file: rel,
      line,
      label: 'em-dash in a user-visible string',
      why: `The house rule allows no em-dashes in anything the site shows; use a colon, comma, full stop or restructure: "${snippet}"`,
    });
  }
}

if (problems.length) {
  console.error(`\n[content-lint] BUILD FAILED: ${problems.length} copy defect(s):\n`);
  const seen = new Set();
  for (const p of problems) {
    console.error(`  ✗ ${p.file}:${p.line}  ${p.label}`);
    if (!seen.has(p.label)) {
      console.error(`      ${p.why}`);
      seen.add(p.label);
    }
  }
  console.error(
    '\nThese render as visible junk on the page. Fix the source, do not silence the lint.' +
      '\nPattern list: scripts/content-lint-patterns.mjs\n',
  );
  process.exit(1);
}

console.log(`[content-lint] OK: ${files} file(s) clean against ${PATTERNS.length + 3} checks.`);
