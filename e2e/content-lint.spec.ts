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

