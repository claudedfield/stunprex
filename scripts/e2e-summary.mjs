/**
 * D-WEB-10 · e2e run summariser.
 *
 * Reads Playwright's JSON report and writes a run summary.
 *
 *   node scripts/e2e-summary.mjs                    → appends to ../Q1_Status/e2e_log.md
 *   node scripts/e2e-summary.mjs --github-summary   → writes to $GITHUB_STEP_SUMMARY
 *
 * WHY TWO MODES: Q1_Status/ lives in the StunpreX project folder, OUTSIDE this
 * git repository, so a CI runner has no such path and cannot append to the
 * ledger. In CI the summary goes to the job summary and the full report is
 * uploaded as an artifact; the ledger is appended on local/relay runs, where
 * the path resolves.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '..');
const RESULTS = path.join(REPO, 'e2e-results.json');
const LEDGER = path.resolve(REPO, '../Q1_Status/e2e_log.md');
const GITHUB_MODE = process.argv.includes('--github-summary');
// --alert-body <path>: write a plain-text failure summary for the nightly email.
const ALERT_IDX = process.argv.indexOf('--alert-body');
const ALERT_PATH = ALERT_IDX > -1 ? process.argv[ALERT_IDX + 1] : null;
// --gh-output: emit run facts as GitHub step outputs, for the alert subjects.
const GH_OUTPUT = process.argv.includes('--gh-output');

if (!fs.existsSync(RESULTS)) {
  console.error(`[e2e-summary] no results at ${RESULTS} — did the suite run?`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));

/** Walk the nested suite tree and flatten to one row per test. */
const rows = [];
const walk = (suite, trail = []) => {
  const here = suite.title ? [...trail, suite.title] : trail;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      const last = t.results?.[t.results.length - 1];
      rows.push({
        title: [...here, spec.title].filter(Boolean).join(' › '),
        status: t.status === 'skipped' ? 'skipped' : last?.status ?? 'unknown',
        expected: spec.ok,
        // Strip ANSI colour codes — the ledger is read as plain markdown.
        error:
          last?.error?.message
            // eslint-disable-next-line no-control-regex
            ?.replace(/\[[0-9;]*m/g, '')
            .split('\n')
            .slice(0, 8)
            .join('\n') ?? null,
      });
    }
  }
  for (const child of suite.suites ?? []) walk(child, here);
};
for (const s of report.suites ?? []) walk(s);

const passed = rows.filter((r) => r.status === 'passed').length;
const skipped = rows.filter((r) => r.status === 'skipped').length;
const failures = rows.filter((r) => r.status !== 'passed' && r.status !== 'skipped');

// Playwright's JSON report does not serialise `use.baseURL`, so fall back to the
// default declared in playwright.config.ts — one source of truth, no drift.
const configDefault = fs
  .readFileSync(path.join(REPO, 'playwright.config.ts'), 'utf8')
  .match(/E2E_BASE_URL\s*\?\?\s*'([^']+)'/)?.[1];
const baseURL = process.env.E2E_BASE_URL ?? configDefault ?? '(unknown)';
const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
const durationMs = Math.round(report.stats?.duration ?? 0);
const verdict = failures.length === 0 ? 'PASS' : 'FAIL';

const failureBlock = failures.length
  ? failures
      .map((f) => `  - **${f.title}** — ${f.status}\n    \`\`\`\n${f.error ?? '(no message)'}\n    \`\`\``)
      .join('\n')
  : '  _(none)_';

const entry = `
## ${when} — ${verdict}

- **Target:** \`${baseURL}\`
- **Trigger:** ${process.env.GITHUB_EVENT_NAME ?? 'local'}${process.env.GITHUB_RUN_ID ? ` (run ${process.env.GITHUB_RUN_ID})` : ''}
- **Result:** ${passed} passed · ${failures.length} failed · ${skipped} skipped · ${(durationMs / 1000).toFixed(1)}s

**Failures, verbatim:**
${failureBlock}
`;

if (GH_OUTPUT) {
  // Info mode for the workflow: never fails, so a red run's gating stays driven
  // by the test step rather than by this script's exit code.
  const out = process.env.GITHUB_OUTPUT;
  const facts = {
    passed: String(passed),
    failed: String(failures.length),
    skipped: String(skipped),
    total: String(rows.length),
    date: when,
  };
  const text = Object.entries(facts)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  if (out) fs.appendFileSync(out, `${text}\n`, 'utf8');
  console.log(`[e2e-summary] run facts: ${text.replace(/\n/g, ' ')}`);
  process.exit(0);
}

if (ALERT_PATH) {
  // Plain text, no markdown: this is read in an email client.
  const lines = [
    `The nightly e2e run against ${baseURL} FAILED.`,
    '',
    `${failures.length} failed, ${passed} passed, ${skipped} skipped, ${when}.`,
    '',
    'Failing tests:',
    ...(failures.length
      ? failures.map((f) => `  - ${f.title} [${f.status}]`)
      : ['  (the run did not report individual test results)']),
  ];
  fs.writeFileSync(ALERT_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.log(`[e2e-summary] alert body written to ${ALERT_PATH}`);
  process.exit(0);
}

if (GITHUB_MODE) {
  const out = process.env.GITHUB_STEP_SUMMARY;
  if (out) fs.appendFileSync(out, entry, 'utf8');
  console.log(entry);
  console.log(
    '[e2e-summary] CI mode — Q1_Status/e2e_log.md is outside this repo and was not written.\n' +
      '[e2e-summary] Copy this entry into the ledger, or re-run locally with `npm run e2e:log`.',
  );
} else {
  if (!fs.existsSync(LEDGER)) {
    fs.writeFileSync(
      LEDGER,
      `# StunpreX — e2e run log\n\n` +
        `Appended by \`stunprexcom/scripts/e2e-summary.mjs\` (D-WEB-10). Newest last.\n` +
        `CI runs cannot write here (this folder is outside the website repo) — those\n` +
        `summaries land in the GitHub job summary and the uploaded artifact.\n`,
      'utf8',
    );
  }
  fs.appendFileSync(LEDGER, entry, 'utf8');
  console.log(`[e2e-summary] appended to ${LEDGER}`);
  console.log(entry);
}

process.exit(failures.length === 0 ? 0 : 1);
