import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * D-WEB-22: the content lint.
 *
 * D-WEB-20 Phase B shipped 26 visible copy defects across seven live posts. The
 * metadata gate passed the whole time, because a doubled bold marker is not a
 * metadata problem. These tests exist so the lint that now catches them cannot
 * quietly stop catching them.
 */

function repoRoot(): string {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, 'package.json')) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }
  return dir;
}
const REPO = repoRoot();

function lint(dir?: string): { code: number; out: string } {
  const args = ['scripts/content-lint.mjs', ...(dir ? ['--dir', dir] : [])];
  try {
    return { code: 0, out: execFileSync('node', args, { cwd: REPO, encoding: 'utf8' }) };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('the live corpus passes the content lint', () => {
  const { code, out } = lint();
  expect(code, out).toBe(0);
  expect(out).toContain('[content-lint] OK');
});

test('clean copy passes, including correctly closed bold italic', () => {
  const { code } = lint(path.join(REPO, 'e2e/fixtures/content-lint'));
  // the directory also holds the defect fixture, so this must fail; the point of
  // the clean fixture is that it contributes none of the reported problems
  const { out } = lint(path.join(REPO, 'e2e/fixtures/content-lint'));
  expect(code).toBe(1);
  expect(out).not.toContain('clean.mdx');
});

test('every defect pattern is caught, and all in one run', () => {
  const { code, out } = lint(path.join(REPO, 'e2e/fixtures/content-lint'));
  expect(code).toBe(1);
  for (const label of [
    'doubled bold marker',
    'doubled colon',
    'doubled comma',
    'doubled full stop before an italic close',
    'heading marker collision',
    'paren and bold collision',
    'stranded percent sign',
    'unmatched bold marker',
  ]) {
    expect(out, `pattern not caught: ${label}`).toContain(label);
  }
});

/**
 * D-WEB-23: the UI scope. layout.tsx carried the site default title and Open
 * Graph string with an em-dash, which put one on the share preview of every page
 * that does not set its own. The lint now reads string literals in UI files.
 */
function lintUi(file: string): { code: number; out: string } {
  try {
    return {
      code: 0,
      out: execFileSync('node', ['scripts/content-lint.mjs', '--ui', file], { cwd: REPO, encoding: 'utf8' }),
    };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('an em-dash in a user-visible UI string fails the lint, naming file and line', () => {
  const { code, out } = lintUi(path.join(REPO, 'e2e/fixtures/content-lint-ui/dirty.tsx'));
  expect(code).toBe(1);
  expect(out).toContain('em-dash in a user-visible string');
  expect(out).toContain('dirty.tsx:3');
  // Line 4 opens with a URL string. If its "//" were read as a comment, the
  // em-dash in the next string on that line would be hidden and this would fail.
  expect(out).toContain('dirty.tsx:4');
  // Line 2 is a comment; a comment is not output.
  expect(out).not.toContain('dirty.tsx:2');
});

test('em-dashes in comments are ignored, and clean strings pass', () => {
  const { code, out } = lintUi(path.join(REPO, 'e2e/fixtures/content-lint-ui/clean.tsx'));
  expect(code, out).toBe(0);
});


// COO-DEV-0042: em-dashes in page text. The old drill pages are rewritten by hand over time, so the
// lint holds every file to its recorded count: a new page may have none, and the total only falls.
test('an em-dash in a new page fails the lint; the same page without it passes', async () => {
  const os = await import('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'emdash-'));
  const run = () => {
    try {
      return { code: 0, out: execFileSync('node', ['scripts/content-lint.mjs', '--dir', dir, '--em-dash'], { cwd: REPO, encoding: 'utf8' }) };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
    }
  };
  fs.writeFileSync(path.join(dir, 'new-page.mdx'), '---\ntitle: "A page"\n---\n\nA sentence — with a dash.\n');
  const bad = run();
  expect(bad.code, bad.out).not.toBe(0);
  expect(bad.out).toContain('em-dash in page text');
  expect(bad.out).toContain('new-page.mdx');
  fs.writeFileSync(path.join(dir, 'new-page.mdx'), '---\ntitle: "A page"\n---\n\nA sentence, with a comma.\n');
  expect(run().code).toBe(0);
});

test('the em-dash baseline only goes down', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(REPO, 'scripts/em-dash-baseline.json'), 'utf8')) as Record<string, number>;
  const total = Object.values(baseline).reduce((a, b) => a + b, 0);
  // 2,569 on 7 Oct 2026, all on the 91 drill pages. Lower this number as pages are rewritten.
  expect(total, 'the allowance was raised; remove the dashes instead').toBeLessThanOrEqual(2569);
  for (const [file, allowed] of Object.entries(baseline)) {
    const full = path.join(REPO, 'content', file);
    const found = fs.existsSync(full) ? (fs.readFileSync(full, 'utf8').match(/—/g) ?? []).length : 0;
    expect(allowed, `${file}: its allowance is above what the page holds; lower it`).toBe(found);
  }
});
