/**
 * D-WEB-22 · Copy-defect patterns for the content lint.
 *
 * THIS IS THE LIST TO EXTEND. A mechanical pass over the corpus that can leave a
 * new kind of scar should add the scar's shape here in the same commit, so the
 * next pass cannot ship it.
 *
 * Each entry: `re` is tested against the MDX source of every post and drill,
 * `label` is what the build prints, and `why` explains the defect to whoever
 * hits it at 2am.
 *
 * Escapes are doubled where a pattern is written as a string; these are real
 * RegExp literals, so write them normally.
 */
export const PATTERNS = [
  {
    label: 'doubled bold marker (****)',
    re: /\*\*\*\*/g,
    why: 'A replacement carrying its own ** landed against a ** already in the file. Renders as literal asterisks.',
  },
  {
    label: 'doubled colon (::)',
    re: /::/g,
    why: 'A replacement ending in a colon landed against a colon already in the file.',
  },
  {
    label: 'doubled comma (,,)',
    re: /,,/g,
    why: 'A replacement ending in a comma landed against a comma already in the file.',
  },
  {
    label: 'doubled full stop before an italic close (..*)',
    re: /\.\.\*/g,
    why: 'An italic wrapper survived a replacement that was meant to drop it.',
  },
  {
    label: 'heading marker collision (### ##)',
    re: /#{3} #{2}/g,
    why: 'Two heading markers on one line; a heading was rewritten without its hashes.',
  },
  {
    label: 'paren and bold collision ().**).**)',
    // The review reported this as ").)**"; the shape it actually takes is
    // ").**).**", which is why a scan for the reported string missed two of them.
    re: /\)\.\*\*\)\.\*\*|\)\.\)\*\*/g,
    why: 'A bold lead-in ending in ).** landed against the same sequence already in the file.',
  },
  {
    label: 'stranded percent sign (%.)',
    re: /(?<![0-9])%\./g,
    why: 'A replacement ended at the number and left its unit behind, e.g. "by 30%." losing the 30.',
  },
];

/**
 * Unmatched bold markers, checked per line rather than by regex.
 * `**bold**` is even; `***bold italic***` is also even (two \*\* matches);
 * an odd count means a marker is visible in the rendered page.
 * Fenced code blocks are skipped.
 */
export function unmatchedBold(source) {
  const out = [];
  let fenced = false;
  source.split('\n').forEach((line, i) => {
    if (line.trimStart().startsWith('```')) fenced = !fenced;
    if (fenced) return;
    const n = (line.match(/\*\*/g) ?? []).length;
    if (n % 2 === 1) out.push({ line: i + 1, text: line.trim().slice(0, 90) });
  });
  return out;
}
