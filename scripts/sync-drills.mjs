#!/usr/bin/env node
/**
 * sync-drills.mjs — Foundation Wave D
 *
 * Reads Drill_*.md files from DRILL_SOURCE_DIR, parses them, applies
 * provenance stripping per brief §2.1, and writes MDX to content/drills/.
 *
 * Evaluator gate: drills without a sibling __evaluator.md containing
 * "PASS" are skipped before write.
 *
 * Provenance leak check: runs a regex over the assembled MDX body
 * before writing; aborts + sets exitCode=1 on a hit.
 *
 * Usage:
 *   node scripts/sync-drills.mjs
 *   DRILL_SOURCE_DIR=/path/to/drills node scripts/sync-drills.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

const DRILL_SOURCE_DIR = process.env.DRILL_SOURCE_DIR ?? join(REPO_ROOT, 'repo-drills')
const MDX_OUT_DIR = join(REPO_ROOT, 'content', 'drills')

// Forbidden patterns — any hit in the assembled MDX body aborts the write
const PROVENANCE_LEAK = /conviction \d+|wave \d+|block \d+|weeks \d/i

// Patterns to strip inline from prose
const INLINE_STRIP = [
  // Parentheticals where Conviction N appears anywhere inside: (... Conviction N ...)
  /\([^)]*Conviction\s+\d+[^)]*\)/g,
  // Conviction N (theme text) — conviction followed by parenthetical explanation
  /(?:Codex\s+)?Conviction\s+\d+\s*\([^)]*\)/g,
  // Conviction N — theme.  at start of bold: **Conviction N — theme.**
  /\*\*Conviction\s+\d+\s+—\s+[^*]+\.\*\*/g,
  // "Conviction N, prose" — conviction followed by comma (inline reference)
  /(?:Codex\s+)?Conviction\s+\d+,?\s*/g,
  // "Decision E", "Decision A" etc. followed by space or punctuation
  /Decision\s+[A-Z](?=[^a-z]|$)/g,
  // "Wave N" references
  /Wave\s+\d+/g,
  // "Block N" references  
  /Block\s+\d+/g,
  // "Weeks N.N" references
  /Weeks\s+[\d.]+/g,
  // version strings e.g. v0.7.1
  /v0\.\d+\.\d+/g,
]

/** Strip provenance markers from a prose string */
function stripProvenance(text) {
  let out = text
  for (const re of INLINE_STRIP) {
    out = out.replace(re, '')
  }
  // Clean up empty parens left behind
  out = out.replace(/\(\s*\)/g, '')
  // Collapse multiple spaces
  out = out.replace(/  +/g, ' ')
  return out
}

/** Convert ASCII-diagram code blocks (``` ... ```) to <pre>{`...`}</pre> for MDX */
function convertCodeBlocks(text) {
  return text.replace(/```[^\n]*\n([\s\S]*?)```/g, (_match, code) => {
    // Escape backticks inside the code block for template literal safety
    const escaped = code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
    return `<pre>{\`${escaped}\`}</pre>`
  })
}

/** Parse an evaluator file and return the verdict string (or null) */
function parseEvaluatorVerdict(evalPath) {
  if (!existsSync(evalPath)) return null
  const text = readFileSync(evalPath, 'utf-8')
  // Look for lines like: **PASS.** or **Final verdict: PASS** or *Verdict: PASS.*
  // Capture the verdict word
  const m = text.match(/\bverdict[:\s*]*(?:\*+)?([A-Z]+(?:\s*\([^)]+\))?)/i)
  if (!m) return null
  return m[1].trim()
}

/** Parse conviction themes from the Codex tags section */
function parseConvictionThemes(text) {
  const themes = []
  // Find the Convictions instantiated block
  const blockMatch = text.match(/\*\*Convictions instantiated\*\*([\s\S]*?)(?=\n\n\*\*|\n---|\n##)/)
  if (!blockMatch) return themes

  const block = blockMatch[1]
  // Each conviction line: - **Conviction N — Theme text.** prose explanation
  const re = /\*\*Conviction\s+\d+\s+—\s+([^*]+)\.\*\*/g
  let m
  while ((m = re.exec(block)) !== null) {
    themes.push(m[1].trim())
  }
  return themes
}

/** Parse capacity families into primary[] and secondary[] arrays */
function parseCapacities(text) {
  const primary = []
  const secondary = []

  // Find Capacities trained block
  const blockMatch = text.match(/\*\*Capacities trained\*\*[\s\S]*?\n([\s\S]*?)(?=\n---|\n##)/)
  if (!blockMatch) return { primary, secondary }

  const block = blockMatch[1]
  const families = ['Perceptual', 'Cognitive', 'Motor', 'Communication', 'Affective', 'Adaptive']

  for (const fam of families) {
    const lineRe = new RegExp(`\\*${fam}:\\*[^\\n]*`, 'i')
    const lineMatch = block.match(lineRe)
    if (!lineMatch) continue
    const line = lineMatch[0]
    // Check if "primary" is mentioned explicitly
    if (/\*\*primary\*\*/i.test(line)) {
      primary.push(fam)
    } else if (/\*\*secondary[^*]*\*\*/i.test(line) || /secondary/i.test(line)) {
      secondary.push(fam)
    } else if (/not primary/i.test(line)) {
      // skip
    } else {
      // If mentioned at all without explicit primary/secondary, treat as secondary
      secondary.push(fam)
    }
  }

  return { primary, secondary }
}

/** Parse Player Operating Principle */
function parsePlayerOperatingPrinciple(text) {
  // - *Scan-decide-receive* — the canonical ...
  const m = text.match(/\*\*Player Operating Principle reinforced\*\*[\s\S]*?\n-\s+\*([^*]+)\*/)
  if (!m) return ''
  return m[1].trim()
}

/** Parse metadata block */
function parseMetadata(text) {
  const metaMatch = text.match(/## Metadata\n([\s\S]*?)(?=\n---|\n##)/)
  if (!metaMatch) return null
  const block = metaMatch[1]

  const get = (label) => {
    const re = new RegExp(`\\*\\*${label}:\\*\\*(.+)`, 'i')
    const m = block.match(re)
    return m ? m[1].trim() : null
  }

  // Age band — segment-first parser handles both drill formats:
  // Format A: "introducible from **N–N Name**; central in **N–N Name**; refined/maintenance through **N–N Name**"
  // Format B: "N–N (Name, primary); N–N introducible in simplified form; N–N appropriate at Levels N–N"
  const ageBandLine = get('Age band')
  const ageBand = {}
  if (ageBandLine) {
    // Band name fallback map (for Format B segments that have no bold or parenthetical name)
    const BAND_NAMES = {
      '5–8': 'Discovery', '5-8': 'Discovery',
      '9–12': 'Foundation', '9-12': 'Foundation',
      '13–16': 'Development', '13-16': 'Development',
      '17–20': 'Specialisation', '17-20': 'Specialisation',
    }
    const segs = ageBandLine.split(';').map(s => s.trim())
    for (const seg of segs) {
      // Extract age range
      const rangeM = seg.match(/\d+[\u2013-]\d+/)
      if (!rangeM) continue
      const range = rangeM[0]
      // Resolve band string: bold text wins > parenthetical first word > BAND_NAMES lookup > bare range
      const boldM = seg.match(/\*\*([^*]+)\*\*/)
      let band
      if (boldM) {
        band = boldM[1].trim()
      } else {
        const parenWordM = seg.match(/\d+[\u2013-]\d+\s*\((\w+)/)
        if (parenWordM && !/^(primary|secondary|simplified|introducible|appropriate|maintenance)/i.test(parenWordM[1])) {
          band = range + ' ' + parenWordM[1]
        } else {
          band = BAND_NAMES[range] ? range + ' ' + BAND_NAMES[range] : range
        }
      }
      // Determine role from segment start keyword (Format A) or inline keyword (Format B)
      const segLower = seg.trimStart()
      if (/^introducible\b/i.test(segLower)) {
        ageBand.introducible = band
      } else if (/^central\b/i.test(segLower)) {
        ageBand.central = band
      } else if (/^(?:maintenance|refined)\b/i.test(segLower)) {
        ageBand.maintenance = band
      } else if (/\bprimary\b/i.test(seg)) {
        // Format B primary segment — serves as both introducible and central
        ageBand.central = band
        ageBand.introducible = band
      } else if (/\bappropriate\b/i.test(seg) && !/^introducible/i.test(segLower)) {
        ageBand.maintenance = band
      }
      // "N–N introducible in simplified form ..." is intentionally skipped —
      // it's a footnote variant, not a primary band assignment
    }
  }

  // Players: combine all digit values into a range, e.g. "1 (primary); 2–4" → "1–4"
  let players = ''
  const playersLine = get('Players')
  if (playersLine) {
    const boldM = playersLine.match(/\*\*([^*]+)\*\*/)
    if (boldM) {
      players = boldM[1].trim()
    } else {
      const nums = [...playersLine.matchAll(/\d+/g)].map(m => parseInt(m[0]))
      if (nums.length >= 2) players = Math.min(...nums) + '\u2013' + Math.max(...nums)
      else if (nums.length === 1) players = String(nums[0])
      else players = playersLine.split(/[.(;]/)[0].trim()
    }
  }

  // Duration: first time-range or number before "min"
  let duration = ''
  const durLine = get('Duration')
  if (durLine) {
    const durM = durLine.match(/([\d–-]+ ?min[^.]+)/)
    duration = durM ? durM[1].trim() : durLine.split('.')[0].trim()
  }

  // Environment: strip trailing dash-clause
  let environment = ''
  const envLine = get('Environment')
  if (envLine) {
    environment = envLine.split(' — ')[0].trim().replace(/^any/i, 'Any')
  }

  // Equipment: parse first bold phrase items
  let equipment = []
  const eqLine = get('Equipment')
  if (eqLine) {
    // Extract items wrapped in ** or before "With server" / "Optional"
    const stripped = eqLine.replace(/\*\*/g, '')
    // Split on common delimiters; take up to 3 items
    const parts = stripped.split(/[,.]/).map(s => s.trim()).filter(Boolean)
    equipment = parts.slice(0, 2).map(s => s.replace(/^with.*/i, '').trim()).filter(s => s.length > 1)
  }

  // Primary objectives: split on comma
  let primaryObjectives = []
  const objLine = get('Primary objectives')
  if (objLine) {
    primaryObjectives = objLine.split(/[,;]/).map(s => {
      s = s.trim().replace(/\.$/, '')
      return s.charAt(0).toUpperCase() + s.slice(1)
    }).filter(Boolean)
  }

  // Difficulty: "N (baseline) → N (elite)"
  let difficulty = { baseline: 1, elite: 5 }
  const diffLine = get('Difficulty')
  if (diffLine) {
    const diffM = diffLine.match(/(\d+)\s*\(baseline\).*?(\d+)\s*\(elite\)/i)
    if (diffM) difficulty = { baseline: parseInt(diffM[1]), elite: parseInt(diffM[2]) }
  }

  return { ageBand, players, duration, environment, equipment, primaryObjectives, difficulty }
}

/** Extract description from first 2 sentences of Introduction */
function extractDescription(body) {
  const introMatch = body.match(/## Introduction\n+([\s\S]*?)(?=\n---|\n##)/)
  if (!introMatch) return ''
  const intro = introMatch[1].trim()
  // Take first 2 sentences
  const sentences = intro.split(/(?<=[.!?])\s+/)
  return sentences.slice(0, 2).join(' ').replace(/\n/g, ' ').trim()
}

/** Build the MDX string for a parsed drill */
function buildMDX({ title, slug, drillId, date, description, convictionThemes,
                    capacities, playerOperatingPrinciple, ageBand, players,
                    duration, environment, equipment, difficulty, primaryObjectives, body }) {

  const yamlArr = (arr) => arr.map(s => `    - "${s}"`).join('\n')
  const yamlArrInline = (arr) => `[${arr.map(s => `"${s}"`).join(', ')}]`
  const yamlEqArr = (arr) => arr.map(s => `  - "${s}"`).join('\n')

  const ageBandYaml = [
    ageBand.introducible ? `  introducible: "${ageBand.introducible}"` : null,
    ageBand.central      ? `  central: "${ageBand.central}"`           : null,
    ageBand.maintenance  ? `  maintenance: "${ageBand.maintenance}"`   : null,
  ].filter(Boolean).join('\n')

  return `---
title: "${title}"
slug: "${slug}"
drillId: "${drillId}"
date: "${date}"
lastModified: "${date}"
description: "${description.replace(/"/g, '\\"')}"

codexAnchors:
  convictionThemes:
${yamlArr(convictionThemes)}
  capacities:
    primary: ${yamlArrInline(capacities.primary)}
    secondary: ${yamlArrInline(capacities.secondary)}
  playerOperatingPrinciple: "${playerOperatingPrinciple}"

ageBand:
${ageBandYaml}
players: "${players}"
duration: "${duration}"
environment: "${environment}"
equipment:
${yamlEqArr(equipment)}
difficulty:
  baseline: ${difficulty.baseline}
  elite: ${difficulty.elite}
primaryObjectives:
${yamlEqArr(primaryObjectives)}

status: "published"
---

${body.trim()}
`
}

/** Process one drill source file */
function processDrillFile(srcPath, slug) {
  const raw = readFileSync(srcPath, 'utf-8')

  // --- Evaluator gate ---
  const evalPath = srcPath.replace(/\.md$/, '__evaluator.md')
  const verdict = parseEvaluatorVerdict(evalPath)
  if (!verdict) {
    console.log(`[sync-drills] ⚠ skipped ${slug} — no evaluator file found`)
    return { status: 'skipped' }
  }
  if (!/^PASS/i.test(verdict)) {
    console.log(`[sync-drills] ⚠ skipped ${slug} — evaluator verdict: ${verdict}`)
    return { status: 'skipped' }
  }

  // --- Check for Metadata block ---
  if (!/## Metadata/.test(raw)) {
    console.log(`[sync-drills] ✗ failed ${slug} — no ## Metadata block found`)
    return { status: 'failed' }
  }

  // --- Parse frontmatter fields ---
  const titleMatch = raw.match(/^#\s+(.+)/m)
  const title = titleMatch ? titleMatch[1].trim() : slug

  const drillIdMatch = raw.match(/\*\*Drill ID:\*\*\s*(\S+)/)
  const drillId = drillIdMatch ? drillIdMatch[1].trim() : ''

  const dateMatch = raw.match(/\*\*Library entry date:\*\*\s*(\d{4}-\d{2}-\d{2})/)
  const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().slice(0, 10)

  const convictionThemes = parseConvictionThemes(raw)
  const capacities = parseCapacities(raw)
  const playerOperatingPrinciple = parsePlayerOperatingPrinciple(raw)
  const meta = parseMetadata(raw)
  if (!meta) {
    console.log(`[sync-drills] ✗ failed ${slug} — could not parse Metadata block`)
    return { status: 'failed' }
  }

  // --- Extract prose body (Introduction section onwards) ---
  const introIdx = raw.indexOf('\n## Introduction')
  if (introIdx === -1) {
    console.log(`[sync-drills] ✗ failed ${slug} — no ## Introduction section found`)
    return { status: 'failed' }
  }
  let rawBody = raw.slice(introIdx + 1) // skip the leading newline

  // Strip header-level provenance lines (Library status, Codex source, Library entry date)
  rawBody = rawBody.replace(/^\*\*Library status:\*\*.*$/gm, '')
  rawBody = rawBody.replace(/^\*\*Codex source:\*\*.*$/gm, '')
  rawBody = rawBody.replace(/^\*\*Library entry date:\*\*.*$/gm, '')

  // Strip conviction section header lines (## Codex tags, ## Metadata — already excluded by slice, but be safe)
  rawBody = rawBody.replace(/^## Codex tags[\s\S]*?(?=## Introduction)/m, '')

  // Apply inline provenance stripping
  rawBody = stripProvenance(rawBody)

  // Convert code blocks → <pre>{`...`}</pre> for MDX
  rawBody = convertCodeBlocks(rawBody)

  // Extract description from stripped body
  const description = extractDescription(rawBody)

  // --- Assemble MDX ---
  const mdxBody = buildMDX({
    title,
    slug,
    drillId,
    date,
    description,
    convictionThemes,
    capacities,
    playerOperatingPrinciple,
    ageBand: meta.ageBand,
    players: meta.players,
    duration: meta.duration,
    environment: meta.environment,
    equipment: meta.equipment,
    difficulty: meta.difficulty,
    primaryObjectives: meta.primaryObjectives,
    body: rawBody,
  })

  // --- Provenance leak check ---
  if (PROVENANCE_LEAK.test(mdxBody)) {
    const hits = mdxBody.match(new RegExp(PROVENANCE_LEAK.source, 'gi'))
    console.error(`[sync-drills] PROVENANCE LEAK in ${slug}.mdx — hits: ${hits?.join(', ')} — aborting write`)
    process.exitCode = 1
    return { status: 'failed' }
  }

  // --- Write ---
  const outPath = join(MDX_OUT_DIR, `${slug}.mdx`)
  writeFileSync(outPath, mdxBody, 'utf-8')
  console.log(`[sync-drills] ✓ wrote content/drills/${slug}.mdx`)
  return { status: 'ok' }
}

/** Main */
function main() {
  console.log(`[sync-drills] Source: ${DRILL_SOURCE_DIR}`)

  if (!existsSync(DRILL_SOURCE_DIR)) {
    console.log(`[sync-drills] Source dir not found — skipping (non-fatal on Vercel if repo-drills is the default)`)
    return
  }

  // Ensure output directory exists
  mkdirSync(MDX_OUT_DIR, { recursive: true })

  // Collect drill source files (Drill_*.md, excluding *__evaluator.md)
  const allFiles = readdirSync(DRILL_SOURCE_DIR)
  const drillFiles = allFiles
    .filter(f => /^Drill_.*\.md$/.test(f) && !f.includes('__evaluator'))
    .sort()

  console.log(`[sync-drills] Found ${drillFiles.length} drill source file${drillFiles.length === 1 ? '' : 's'}`)

  let processed = 0, skipped = 0, failed = 0

  for (const file of drillFiles) {
    // Slug: strip "Drill_NN_" prefix and ".md" suffix
    const slug = file.replace(/^Drill_\d+_/, '').replace(/\.md$/, '')
    const srcPath = join(DRILL_SOURCE_DIR, file)

    const result = processDrillFile(srcPath, slug)
    if (result.status === 'ok') processed++
    else if (result.status === 'skipped') skipped++
    else failed++
  }

  console.log(`[sync-drills] Done. ${processed} processed, ${skipped} skipped, ${failed} failed.`)
}

main()
