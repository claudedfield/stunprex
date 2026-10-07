/**
 * D-WEB-24 · Copy the methodology page's text of record into the site, mechanically.
 *
 * The Writer owns the wording (Stockpile/Writer/2026-W38/methodology-page.md) and the site
 * never edits it: the owner's marks go to the text of record first, then this script runs
 * again. It keeps the body after the first `---` line, leaves out the module header and the
 * canon trace (internal only), and takes title, metaTitle and description from the text's
 * "Proposed frontmatter" line. It refuses a text that breaks the page's rules or that MDX
 * would read as code.
 *
 *   node scripts/sync-methodology.mjs [path to the text of record]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = path.resolve(import.meta.dirname, '..');
const SOURCE = path.resolve(process.argv[2] ?? path.join(REPO, '../Stockpile/Writer/2026-W38/methodology-page.md'));
const TARGET = path.join(REPO, 'content/pages/methodology.mdx');

function refuse(why) {
  console.error(`[sync-methodology] REFUSED: ${why}`);
  process.exit(1);
}

const raw = fs.readFileSync(SOURCE, 'utf8');
const lines = raw.split('\n');
const h1 = lines.find((l) => l.startsWith('# '))?.slice(2).trim();
const field = (name) => raw.match(new RegExp('`' + name + '`: "([^"]+)"'))?.[1];
const title = field('title');
const metaTitle = field('metaTitle');
const description = field('description');

if (!title || !metaTitle || !description) refuse('the Proposed frontmatter line lacks title, metaTitle or description');
if (h1 !== title) refuse(`the H1 "${h1}" differs from the proposed title "${title}"`);
const sep = lines.indexOf('---');
if (sep < 0) refuse('no --- line between the internal header and the body');
const body = lines.slice(sep + 1).join('\n').trim() + '\n';

if (/\u2014/.test(body + title + metaTitle + description)) refuse('an em-dash in the page text');
if (/Conviction\s*\d/i.test(body)) refuse('a conviction number in the page text');
if (/^#{1,6}\s.*Conviction/im.test(body)) refuse('a conviction as a heading');
if (/[{}<]/.test(body)) refuse('a {, } or < that MDX would read as code');

const sha = crypto.createHash('sha256').update(raw).digest('hex');
const frontmatter = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `metaTitle: ${JSON.stringify(metaTitle)}`,
  `description: ${JSON.stringify(description)}`,
  `source: ${JSON.stringify(path.relative(path.join(REPO, '..'), SOURCE))}`,
  `sourceSha256: ${JSON.stringify(sha)}`,
  '---',
  '',
].join('\n');

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, frontmatter + body);
const words = body.split(/\s+/).filter(Boolean).length;
console.log(`[sync-methodology] wrote ${path.relative(REPO, TARGET)}: ${words} words, source sha256 ${sha.slice(0, 12)}`);
