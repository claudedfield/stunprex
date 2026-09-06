import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * D-WEB-16: the Codex provenance gate.
 *
 * The gate is a build-time check rather than a page, so these tests run it as a
 * subprocess over fixture drills instead of driving a browser. They exist
 * because a validator can fail open: if the check silently stops matching, the
 * build keeps passing and wrongly numbered drills ship. These assert that it
 * still bites.
 *
 * Why the field is needed at all: the legacy 1-36 conviction set and Release
 * 1's 1-42 set overlap, so a range check alone cannot tell them apart. Legacy
 * 36 was retired into Conviction 20 while Release 1 carries its own, different,
 * Conviction 36. A range check passes both, so the file must name its
 * namespace.
 */

/** Walk up to the directory holding package.json, whatever the caller's cwd. */
function repoRoot(): string {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, 'package.json')) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }
  return dir;
}

const REPO = repoRoot();
const FIXTURES = path.join(REPO, 'e2e', 'fixtures', 'drills');

/** Run the gate over a temp directory holding only the named fixtures. */
function runGate(...fixtures: string[]): { code: number; out: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drill-gate-'));
  try {
    for (const f of fixtures) fs.copyFileSync(path.join(FIXTURES, f), path.join(dir, f));
    const out = execFileSync('node', ['scripts/validate-drill-tags.mjs', '--drills', dir], {
      cwd: REPO,
      encoding: 'utf8',
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('a drill with no codex_release fails the build', () => {
  const { code, out } = runGate('missing-field.mdx');
  expect(code).toBe(1);
  expect(out).toContain('missing-field.mdx: missing codex_release');
});

test('a drill declaring a release other than R1 fails the build', () => {
  const { code, out } = runGate('wrong-release.mdx');
  expect(code).toBe(1);
  expect(out).toContain('wrong-release.mdx: unknown codex_release: R0.7');
});

test('a conviction id outside Release 1 fails the build', () => {
  const { code, out } = runGate('bad-conviction.mdx');
  expect(code).toBe(1);
  expect(out).toContain('bad-conviction.mdx: conviction id(s) not in Codex Release 1');
});

test('a well formed drill passes the gate', () => {
  const { code, out } = runGate('valid.mdx');
  expect(code).toBe(0);
  expect(out).toContain('[drill-tags] OK');
});

test('one run names every failing file, not just the first', () => {
  const bad = ['missing-field.mdx', 'wrong-release.mdx', 'bad-conviction.mdx'];
  const { code, out } = runGate(...bad, 'valid.mdx');
  expect(code).toBe(1);
  expect(out).toContain('3 problem(s)');
  for (const f of bad) expect(out).toContain(f);
  // The good file is not reported, so a pass is not being counted as a problem.
  expect(out).not.toContain('valid.mdx');
});

test('the published corpus satisfies the gate', () => {
  const out = execFileSync('node', ['scripts/validate-drill-tags.mjs'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  expect(out).toContain('[drill-tags] OK');
});
