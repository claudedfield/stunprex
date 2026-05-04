# StunpreX

> Train Smarter. Play Better. Reach Your Full Potential.

StunpreX is a soccer player development hub for individual development. This repository
holds the marketing site, methodology pages, and (over Wave 2) the drill library, member
dashboard, Coach skill chat surface, Sequence Boards shop, and Contract Review service.

The brand is governed by the **Codex** (currently v0.7.1) and the **Blueprint & Playbook
v2.1**. The website serves the Codex, not the other way around.

## Stack

- [Next.js 15](https://nextjs.org/) — App Router, TypeScript, React 19
- [Tailwind CSS 3](https://tailwindcss.com/)
- Hosted on [Vercel](https://vercel.com/) (auto-deploy from `main`)
- Domain: `stunprex.com` (DNS pointed at Vercel)

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Build

```bash
npm run build
npm run start   # serve the production build locally
```

## Project layout

```
app/                  Next.js App Router pages
  page.tsx              Home
  codex/                Public Codex methodology page
  about/                Methodology-first about page
  pricing/              Four-tier pricing
  playbook/             Section landing (placeholder until Block 2)
  training/             Section landing (placeholder until Block 2)
  community/            Section landing (placeholder until Block 6)
  games/                Section landing (placeholder)
  reviews/              Section landing (placeholder until Block 5)
  shop/                 Section landing (placeholder until Block 5)
  me/                   Member dashboard (placeholder until Block 4)
  methodology/          Plain-language Codex entry (placeholder)
  not-found.tsx         404
  robots.ts             Robots policy
  sitemap.ts            Sitemap
  globals.css           Brand tokens + base typography
components/           Composable React components
  Header.tsx Hero.tsx BenefitsGrid.tsx Pillars.tsx Methodology.tsx
  AudienceHubs.tsx NewsletterCapture.tsx Footer.tsx ComingSoon.tsx
lib/
  nav.ts                Locked eight-section nav + utility nav
public/               Static assets
tailwind.config.ts    Locked palette + typography variables
```

## Brand tokens (Blueprint v2.1 §7 — locked)

| Role | Hex | Use |
| --- | --- | --- |
| Primary | `#FA961C` | CTAs, brand accents |
| Secondary | `#107099` | Headings, structural |
| Body text | `#472B08` | All body copy |
| Background | `#F5FAF5` | Site background |

| Role | Font |
| --- | --- |
| Headings | Mate |
| Body | Play |
| Menu / CTA / technical | Dosis |
| Forum / long-form | Noto Sans |

## Build sequence

This site is built in six 2-week blocks aligned to the Wave-2 90-day plan in Blueprint
§21. See `StunpreX_Website_Build_Plan_v1.docx` in the project root folder for the full
plan.

| Block | Weeks | Goal |
| --- | --- | --- |
| 1 | 1–2 | Foundation, design system, brand spine |
| 2 | 3–4 | Editorial spine, drill library taxonomy, search |
| 3 | 5–6 | First pillar live (Dribbling), content batch, video |
| 4 | 7–8 | Auth, four-tier membership, dashboard, gamification |
| 5 | 9–10 | Shop, Sequence Boards, Reviews MVP |
| 6 | 11–12 | Coach chat, Premium newsletter, Contract Review, community v0.5 |

## Codex guardrails enforced in code

- No fabricated social proof — activity tickers stay dark until real users exist
- No manipulative urgency — no countdown timers
- No fake testimonials
- Affordability is a stance — Free tier is genuinely usable, cancel path always visible
- Capacity-first content design — every Article/Drill must carry at least one capacity tag

## Licence

Proprietary — DField Kft. · Initiative CN-STNPX.
