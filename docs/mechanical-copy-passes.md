# Mechanical copy passes: how the last one broke, and what to do instead

A note for whoever runs the next scripted pass over `content/posts/` or
`content/drills/`. It exists because D-WEB-20 Phase B shipped 26 visible copy
defects to seven live posts, and the same mistake is easy to repeat.

## What happened

Phase B applied 80 replacement rows from the Writer. Each row gave an old span
and a replacement. Phase A had already run, so the old spans no longer matched
the files character for character: em-dashes had become commas, colons and full
stops, and "match" had become "game". The replacement file said to match on the
words and let the replacement supersede whatever Phase A had produced.

So the pass matched on **word tokens** and replaced the character range from the
first matched token to the last. That part was right. The bug was at the edges:
the range absorbed only a trailing `.`, `!` or `?`, and nothing else.

Word tokens do not include punctuation or markup. So whenever a replacement
carried its own boundary characters and the file still had the originals just
outside the matched range, both survived:

| In the file | Replacement began or ended with | What shipped |
|---|---|---|
| `**Setup:** A rectangle` | `**Setup:**` | `****Setup:** A rectangle` |
| `...prescription).**` | `...prescription).**` | `...prescription).**).**` |
| `...decisive form: not` | `...decisive form:` | `...decisive form:: not` |
| `...instruction, one` | `...instruction,` | `...instruction,, one` |
| `*...design.*` (italic) | plain text, italics dropped | `*...design..*` |
| `...by 30%.` | `...smaller than feels comfortable.` | `...comfortable.%.` |

The last one is the clearest illustration: the tokens ended at `30`, so the `%.`
was outside the range and stayed behind after the number it belonged to was gone.

None of this was caught before merge. The build gate validated metadata and was
happy throughout, because a doubled bold marker is not a metadata problem. The
defects were found two days later by an external editorial review.

## What to do instead

1. **Normalise the boundary punctuation on both sides before writing.** Compare
   the trailing run of non-word characters on the replacement against the run
   sitting immediately after the matched range in the file, and keep one. Do the
   same at the start. Markup markers (`**`, `*`, `` ` ``) count as boundary
   characters, not as text.
2. **Run `npm run lint:content` before opening the PR.** It checks every post and
   drill for the defect shapes this class of pass produces, and it now runs in
   `prebuild`, so a failure blocks the build and the deploy.
3. **Extend the pattern list in the same commit.** If a pass can leave a new kind
   of scar, add its shape to `scripts/content-lint-patterns.mjs` before running
   it, not after someone finds it in production.
4. **Read the rendered page, not only the MDX.** A doubled bold marker looks like
   two asterisks in a diff and like broken copy on the page. The two reviews that
   found these defects both read the page.

One more thing worth keeping: when the reported shape of a defect and its real
shape differ, trust the file. The review reported the paren collision as `).)**`;
it is actually `).**).**`, and a scan for the reported string missed two of them.
Both forms are in the pattern list now.
