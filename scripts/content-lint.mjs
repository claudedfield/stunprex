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
 *   node scripts/content-lint.mjs                 → the real corpus
 *   node scripts/content-lint.mjs --dir <path>    → a fixture directory
 */
import fs from 'node:fs';
import path from 'node:path';
import { PATTERNS, unmatchedBold } from './content-lint-patterns.mjs';

const REPO = path.resolve(import.meta.dirname, '..');
const flag = process.argv.indexOf('--dir');
const DIRS =
  flag > -1
    ? [path.resolve(process.argv[flag + 1])]
    : [path.join(REPO, 'content/posts'), path.join(REPO, 'content/drills')];

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

if (problems.length) {
  console.error(`\n[content-lint] BUILD FAILED — ${problems.length} copy defect(s):\n`);
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

console.log(`[content-lint] OK — ${files} file(s) clean against ${PATTERNS.length + 1} defect patterns.`);
