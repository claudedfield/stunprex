#!/usr/bin/env node
/**
 * Create the founding membership lines in Stripe (ProductLines/Stripe_Product_List_v0.2_20261022.md,
 * D-PRICING-06), test mode first. Safe to run again: a price is found by its lookup key and never
 * made twice. Prints IDs, never the key.
 *
 *   node scripts/stripe-products.mjs            plan only (no call to Stripe)
 *   node scripts/stripe-products.mjs --apply    create in test mode (a rk_test_ or sk_test_ key)
 *   node scripts/stripe-products.mjs --apply --live   live mode, only on the owner's word
 *
 * The key is read from STRIPE_SECRET_KEY, or from .env.local beside this folder.
 */
import fs from 'node:fs'
import path from 'node:path'

const here = path.dirname(new URL(import.meta.url).pathname)
const envFile = path.join(here, '..', '.env.local')
const fromFile = fs.existsSync(envFile)
  ? fs.readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('STRIPE_SECRET_KEY='))?.slice(18).replace(/^"|"$/g, '')
  : undefined
const KEY = process.env.STRIPE_SECRET_KEY ?? fromFile ?? ''
const apply = process.argv.includes('--apply')
const live = process.argv.includes('--live')

const DESCRIPTION = 'Includes all Free Tier features. Paid membership additionally provides multi-week planning, the included plan-pack library, and the Paid Tier activities and collections.'
const LINES = [
  { product: 'Parent membership', register: 'P01', lookup: 'parent_founding_month', cents: 888, interval: 'month' },
  { product: 'Parent membership', register: 'P01', lookup: 'parent_founding_year', cents: 8800, interval: 'year' },
  { product: 'Coach membership', register: 'P41', lookup: 'coach_founding_month', cents: 988, interval: 'month' },
  { product: 'Coach membership', register: 'P41', lookup: 'coach_founding_year', cents: 9800, interval: 'year' },
]

function encode(params, prefix = '') {
  return Object.entries(params).flatMap(([k, v]) => {
    if (v === undefined) return []
    const key = prefix ? `${prefix}[${k}]` : k
    if (v !== null && typeof v === 'object') return encode(Array.isArray(v) ? Object.fromEntries(v.map((x, i) => [i, x])) : v, key)
    return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`]
  })
}
async function call(method, p, params = {}) {
  const body = encode(params).join('&')
  const res = await fetch(`https://api.stripe.com${p}${method === 'GET' && body ? `?${body}` : ''}`, {
    method, headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Stripe ${res.status} on ${method} ${p}: ${json.error?.message}`)
  return json
}

if (!apply) {
  console.log('Plan (no call made; add --apply to create in test mode):')
  for (const l of LINES) console.log(`  ${l.product} · ${l.lookup} · ${(l.cents / 100).toFixed(2)} a ${l.interval} · USD tax exclusive, EUR tax inclusive`)
  process.exit(0)
}
const mode = /^(rk|sk)_test_/.test(KEY) ? 'test' : /^(rk|sk)_live_/.test(KEY) ? 'live' : 'none'
if (mode === 'none') { console.error('No Stripe key: put STRIPE_SECRET_KEY=rk_test_... in .env.local'); process.exit(2) }
if (mode === 'live' && !live) { console.error('This is a live key. Live mode needs --live, on the owner\'s word.'); process.exit(3) }
if (mode === 'test' && live) { console.error('--live given with a test key; nothing done.'); process.exit(3) }

const products = new Map()
for (const l of LINES) {
  const found = await call('GET', '/v1/prices', { lookup_keys: [l.lookup], expand: ['data.product'] })
  if (found.data.length) { console.log(`exists  ${l.lookup}  price ${found.data[0].id}  product ${found.data[0].product.id}`); products.set(l.product, found.data[0].product.id); continue }
  let productId = products.get(l.product)
  if (!productId) {
    const search = await call('GET', '/v1/products/search', { query: `metadata['register_id']:'${l.register}' AND active:'true'` })
    productId = search.data[0]?.id
    if (!productId) {
      const made = await call('POST', '/v1/products', {
        name: l.product, description: DESCRIPTION, statement_descriptor: 'STUNPREX',
        metadata: { register_id: l.register, access_requirement: 'active_membership', form: 'founding', decision: 'D-PRICING-06', sales_terms_version: '' },
      })
      productId = made.id
      console.log(`made    product ${l.product}  ${productId}`)
    }
    products.set(l.product, productId)
  }
  const price = await call('POST', '/v1/prices', {
    product: productId, currency: 'usd', unit_amount: l.cents, tax_behavior: 'exclusive',
    currency_options: { eur: { unit_amount: l.cents, tax_behavior: 'inclusive' } },
    recurring: { interval: l.interval }, lookup_key: l.lookup,
    metadata: { register_id: l.register, access_requirement: 'active_membership', form: 'founding', decision: 'D-PRICING-06', sales_terms_version: '' },
  })
  console.log(`made    ${l.lookup}  price ${price.id}`)
}
console.log(`done (${mode} mode)`)
