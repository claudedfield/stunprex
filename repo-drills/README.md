# repo-drills — StunpreX Drill Library Source

This folder is the **source of truth** for all StunpreX drill content.

## What lives here

- `Drill_NN_[slug].md` — full drill file in StunpreX standard format (produced by `stunprex-drill-architect`)
- `Drill_NN_[slug]__evaluator.md` — evaluator report; must contain `Verdict: PASS` (or `PASS (N revision)`) before the drill publishes
- `_index.md` — library index: running list of all drills, IDs, status, brief descriptions

## How content reaches the site

Every Vercel deploy runs:

```
node db/migrate.mjs && node scripts/sync-drills.mjs && next build
```

`scripts/sync-drills.mjs` reads every `Drill_*.md` file in this folder (excluding `*__evaluator.md`), parses it, applies provenance stripping, and writes the result to `content/drills/[slug].mdx`. Next.js then picks up those MDX files and builds the drill pages.

A drill is not published until its evaluator file contains a PASS verdict. The script checks before writing; drills without a PASS are skipped with a warning.

## Adding a new drill

1. Write the drill using the `stunprex-drill-architect` skill — StunpreX standard format
2. Save as `Drill_NN_[slug].md` in this folder
3. Run the evaluator (`stunprex-content-evaluator`) and save the verdict as `Drill_NN_[slug]__evaluator.md`
4. Once verdict is PASS, commit both files and push — the next deploy auto-publishes the drill

## Manual sync (run without full build)

```bash
npm run sync-drills
# or with a custom source:
DRILL_SOURCE_DIR=/path/to/drills node scripts/sync-drills.mjs
```

## Provenance stripping

The sync script automatically strips internal vocabulary before writing MDX:
- `Conviction N —` prefix → theme text only
- `Library status:`, `Library entry date:`, `Codex source:` header lines
- `Decision [A-Z]`, `Wave N`, `Block N`, `Weeks N.N`, `v0.N.N` references

If a provenance leak is detected after stripping, the script aborts that drill and the build fails.

## Automation roadmap

The autonomous drill production lane (`stunprex-drill-architect` scheduled task) will eventually write directly to this folder via a git push. Until then, files are added here manually after production in the workspace `Drills/` folder.
