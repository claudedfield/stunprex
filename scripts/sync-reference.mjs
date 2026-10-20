/**
 * Copy a reference text of record (the Writer's capacity pages) into the site, mechanically, as
 * scripts/sync-methodology.mjs does for /methodology. The Writer owns the wording; the site never
 * edits it. It drops the internal header (the first <!-- --> block), takes the H1 as the title,
 * and refuses a text with an em-dash, a conviction number, or a character MDX would read as code.
 *
 *   node scripts/sync-reference.mjs <text of record> <content/pages/... target>
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REPO = path.resolve(import.meta.dirname, '..');
const [source, target] = process.argv.slice(2).map((p) => path.resolve(p));
if (!source || !target) { console.error('usage: sync-reference.mjs <source> <target>'); process.exit(2); }
const refuse = (why) => { console.error(`[sync-reference] REFUSED ${path.basename(source)}: ${why}`); process.exit(1); };

const raw = fs.readFileSync(source, 'utf8');
const text = raw.replace(/<!--[\s\S]*?-->\s*/, '');
const lines = text.split('\n');
if (!lines[0].startsWith('# ')) refuse('the text does not start with its H1');
const title = lines[0].slice(2).trim();
const body = lines.slice(1).join('\n').trim() + '\n';
if (/—/.test(title + body)) refuse('an em-dash in the page text');
if (/Conviction\s*\d/i.test(body)) refuse('a conviction number in the page text');
if (/[{}<]/.test(body)) refuse('a {, } or < that MDX would read as code');

const sha = crypto.createHash('sha256').update(raw).digest('hex');
const fm = ['---', `title: ${JSON.stringify(title)}`, `source: ${JSON.stringify(path.relative(path.join(REPO, '..'), source))}`, `sourceSha256: ${JSON.stringify(sha)}`, '---', ''].join('\n');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, fm + body);
console.log(`[sync-reference] wrote ${path.relative(REPO, target)}: ${body.split(/\s+/).filter(Boolean).length} words, source sha256 ${sha.slice(0, 12)}`);
