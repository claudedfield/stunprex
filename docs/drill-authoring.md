# Drill authoring notes

How a drill MDX file in `content/drills/` is expected to look, and what the
build gate checks before it will let the site compile.

## Frontmatter template

Copy this block when starting a new drill. Every field below is either required
by the build gate or read by the `/training` filter UI.

```yaml
---
title: "Drill title as it appears on the page"
slug: "url-slug"
description: "One sentence for cards, search results and social previews."
drillId: "SX-DR-000"
status: "draft"            # draft | published. Only published drills appear publicly.
category: "Scanning"       # exactly one, from DRILL_CATEGORIES in lib/types/drill.ts
capacities:
  primary: ["Cognitive"]   # at least one capacity family
  secondary: ["Perceptual"]
ageBand: ["9-12"]          # one or more canon bands: 5-8, 9-12, 13-16, 17-20, 21+
players: "4-8"
equipment: "6 cones, 1 ball per player"
difficulty: 2
maxDifficulty: 5
codex_release: R1          # which Codex release the conviction numbers below speak
convictions: [1, 20, 42]   # Codex Release 1 ids, 1 to 42
playerOperatingPrinciple: "The principle this drill puts under load"
---
```

## `codex_release`

This field names the Codex release that a drill's `convictions` numbers are
written against. `R1` is the only value accepted today.

It exists because a range check on the numbers alone cannot do the job. The
legacy conviction set ran 1 to 36 and Release 1 runs 1 to 42, so the two
overlap across most of their range. Legacy 36 was retired into Conviction 20,
while Release 1 carries its own, different, Conviction 36. A drill still
carrying legacy numbering therefore looks perfectly valid to a validator that
only asks whether each id falls between 1 and 42, and it would ship citing the
wrong convictions. The file has to state which namespace it is speaking, and
the gate has to be told what that namespace is allowed to be.

When a Codex Release 2 arrives, `R2` is **added** to the allowed set in
`scripts/validate-drill-tags.mjs` rather than replacing `R1`. Drills already
numbered against Release 1 stay valid and keep their existing field. The point
of the field is to tell releases apart, which it cannot do if the older value
stops being accepted.

## The build gate

`scripts/validate-drill-tags.mjs` runs automatically as `prebuild`, so a
failing drill fails `npm run build` rather than reaching production. Run it on
its own with:

```bash
npm run validate:drills
```

It fails, naming every offending file in a single run, when a drill:

- has no `codex_release` field (`missing codex_release`);
- declares a release outside the allowed set (`unknown codex_release: <value>`);
- carries a `convictions` id that is not an integer in 1 to 42;
- carries an `ageBand` outside the canon set;
- is missing the `convictions` or `ageBand` block entirely.

Blog posts in `content/posts/` are checked too, for the conviction ids under
`codexAnchors`.

The gate is covered by `e2e/drill-gate.spec.ts`, which runs it against the
fixtures in `e2e/fixtures/drills/` and asserts that each failure mode is caught.
A validator that quietly stops matching would otherwise fail open, passing every
build while wrongly numbered drills ship.
