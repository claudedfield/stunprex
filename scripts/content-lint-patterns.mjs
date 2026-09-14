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

/**
 * D-WEB-23 · UI source files checked for em-dashes in user-visible strings.
 *
 * THIS IS THE UI SCOPE TO EXTEND. Part B of D-WEB-23 widens it to app/ and
 * components/ once its reviewed diff has merged. Paths are repo-relative; a
 * trailing slash means every .ts or .tsx file under that directory.
 *
 * LIMITATION, read before widening: only string literals are checked. JSX text
 * between tags is not, and an apostrophe in JSX text ("don't") would be misread
 * as the start of a string. layout.tsx has neither, which is why it is safe to
 * gate now. Part B must add JSX text handling before this list reaches
 * components/.
 */
export const UI_SCOPE = ['app/layout.tsx'];

/**
 * Em-dashes inside string literals ('...', "...", `...`), skipping line and
 * block comments, because a comment is not output. A "//" inside a string such
 * as a URL is string content, not the start of a comment.
 * Returns [{ line, text }], one entry per em-dash.
 */
export function emDashesInStrings(source) {
  const hits = [];
  let state = 'code'; // code | line | block | sq | dq | tpl
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];
    if (c === '\n') {
      line += 1;
      lineStart = i + 1;
      if (state === 'line') state = 'code';
      continue;
    }
    if (state === 'code') {
      if (c === '/' && n === '/') { state = 'line'; i++; }
      else if (c === '/' && n === '*') { state = 'block'; i++; }
      else if (c === "'") state = 'sq';
      else if (c === '"') state = 'dq';
      else if (c === '`') state = 'tpl';
    } else if (state === 'block') {
      if (c === '*' && n === '/') { state = 'code'; i++; }
    } else if (state !== 'line') {
      if (c === '\\') {
        if (n === '\n') { line += 1; lineStart = i + 2; }
        i++;
      } else if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"') || (state === 'tpl' && c === '`')) {
        state = 'code';
      } else if (c === '—') {
        const end = source.indexOf('\n', i);
        hits.push({ line, text: source.slice(lineStart, end === -1 ? undefined : end).trim().slice(0, 90) });
      }
    }
  }
  return hits;
}

