/**
 * Curated "Questions, answered" seed — StunpreX Community.
 *
 * Eight genuine developmental questions answered in the StunpreX Coach voice
 * (COO-cleared, Codex-clean — see Q1_Status/community_seed_qa_v1.md). These are
 * NOT fake users and NOT fabricated testimonials: real questions, real answers,
 * attributed to "StunpreX Coach".
 *
 * Why static (not DB rows): migrations are not wired into the Vercel build and we
 * have no prod DB credentials here, so we render these from code and MERGE them
 * into the community read queries (lib/community/queries.ts). This makes /community
 * read as a live, useful resource at zero audience without any DB write. Real
 * user Q&A (ask/answer/upvote) continues to flow through Postgres alongside these.
 *
 * Server-only module (imported by queries.ts). Do not import from client code.
 */
import type {
  QuestionWithAuthor,
  AnswerWithAuthor,
  MemberProfile,
  QuestionCategory,
} from '@/lib/types/community'

export const COACH_DISPLAY_NAME = 'StunpreX Coach'
const COACH_USER_ID = 'stunprex-coach'
const COACH_AUTHOR = {
  display_name: COACH_DISPLAY_NAME,
  avatar_url: null,
  role: 'admin' as const,
}
// Fixed timestamps (no Date.now in this codebase). Curated batch, mid-June 2026.
const SEED_BASE_ISO = '2026-06-16T10:00:00.000Z'

interface SeedTag {
  slug: string
  label: string
}

interface SeedDef {
  slug: string
  question: string // serves as both title and body
  category: QuestionCategory
  audience_layer: 'Player' | 'Parent' | 'Coach' | 'Halo'
  tags: SeedTag[]
  answer: string
}

const T = {
  player: { slug: 'player', label: 'Player' },
  parent: { slug: 'parent', label: 'Parent' },
  coach: { slug: 'coach', label: 'Coach' },
  weakFoot: { slug: 'weak-foot', label: 'Weak foot' },
  u10: { slug: 'u10', label: 'U10' },
  deselection: { slug: 'deselection', label: 'Deselection' },
  mental: { slug: 'mental', label: 'Mental' },
  scanning: { slug: 'scanning', label: 'Scanning' },
  tactical: { slug: 'tactical', label: 'Tactical' },
  dribbling: { slug: 'dribbling', label: 'Dribbling' },
  smallSided: { slug: 'small-sided', label: 'Small-sided' },
  drillDesign: { slug: 'drill-design', label: 'Drill design' },
  academy: { slug: 'academy', label: 'Academy' },
  soloPractice: { slug: 'solo-practice', label: 'Solo practice' },
  recovery: { slug: 'recovery', label: 'Recovery' },
  nutrition: { slug: 'nutrition', label: 'Nutrition' },
} satisfies Record<string, SeedTag>

const DEFS: SeedDef[] = [
  {
    slug: 'should-i-worry-my-9-year-old-only-uses-their-strong-foot',
    question: 'My 9-year-old only ever uses their strong foot. Should I be worried?',
    category: 'parent-corner',
    audience_layer: 'Parent',
    tags: [T.parent, T.weakFoot, T.u10],
    answer: `Not worried — but it's worth gently widening. At nine, almost every player favours one foot; that's normal, not a flaw. The goal isn't to force the weak foot in matches, where the instinct to use the strong one is strong. It's to make weak-foot touches *ordinary* in calm, low-pressure moments: in the garden, against a wall, in the warm-up. A right-foot-only player eventually becomes predictable — defenders learn to show them one way. A player comfortable both sides has more answers. Keep it playful, keep it frequent, and let it grow over years rather than weeks. The long horizon does the work.`,
  },
  {
    slug: 'my-child-was-just-deselected-how-do-i-handle-the-next-few-days',
    question: 'My child was just deselected from the team. How do I handle the next few days?',
    category: 'parent-corner',
    audience_layer: 'Parent',
    tags: [T.parent, T.deselection, T.mental],
    answer: `First, this is hard, and it's okay that it stings — for them and for you. A deselection is information about one moment and one coach's view, not a verdict on your child's future. The research on junior-to-senior football is humbling: where a player stands at 12 or 14 tells you very little about where they'll be at 20. In the next ten minutes, listen more than you fix. In the next ten days, keep the ball at their feet for the joy of it, not as a response. In the next ten months, the players who keep developing are rarely the ones who were ahead early — they're the ones who kept going. Your steadiness now matters more than any drill.`,
  },
  {
    slug: 'in-games-im-always-a-second-too-late-to-decide-how-do-i-fix-that',
    question: "I'm quick and good on the ball, but in games I'm always a second too late to decide. How do I fix that?",
    category: 'player-development',
    audience_layer: 'Player',
    tags: [T.player, T.scanning, T.tactical],
    answer: `Good news: this is the most trainable thing in football, and it isn't about thinking faster — it's about *seeing earlier*. The players who decide quickly have already gathered the information before the ball arrives. Watch where Xavi or a top midfielder looks: their heads are moving constantly, scanning the space *before* they receive, so the decision is half-made by the time the ball gets there. Train the scan, not the speed. Before every reception in practice, take a look over each shoulder. It feels mechanical at first; within weeks it becomes a habit you don't notice. The decision gets faster because the picture is already in your head.`,
  },
  {
    slug: 'i-practise-dribbling-moves-for-hours-but-they-never-work-in-matches',
    question: 'I practise dribbling moves for hours but they never work in matches. Why?',
    category: 'player-development',
    audience_layer: 'Player',
    tags: [T.player, T.dribbling, T.smallSided],
    answer: `Because cones don't defend. A move drilled against a static marker lives in a different world from a move under a real opponent who's reading you. The skill isn't the move — it's *when* to use it, against *whom*, in *what* space, and that only develops against live, unpredictable pressure. Keep some isolated repetition to own the mechanics, but spend most of your time in small-sided games and 1v1s where the move has to survive a real defender. You'll do fewer reps and feel messier — that messiness is the learning. The goal isn't a perfect move in an empty space; it's a good-enough move at the right moment.`,
  },
  {
    slug: 'how-should-i-structure-a-u10-session-that-actually-develops-players',
    question: 'I coach U10s. How should I structure a session so it actually develops them?',
    category: 'coaching',
    audience_layer: 'Coach',
    tags: [T.coach, T.drillDesign, T.u10],
    answer: `At this age, more ball-touches and more decisions beat more drills. A simple shape that works: a free, playful warm-up with a ball each (let them explore); one constraint-based game that quietly forces the theme you want — want more scanning? add a rule that rewards it — then small-sided games where they make hundreds of real decisions; finish with free play. Talk less than feels natural; let the game teach. Rotate positions every session — don't lock a ten-year-old into "defender." And protect the joy: a child who loves it at ten is still playing at sixteen, and that's the whole game.`,
  },
  {
    slug: 'what-do-you-mean-by-develop-the-player-not-the-position',
    question: 'What do you actually mean by "develop the player, not the position"?',
    category: 'methodology',
    audience_layer: 'Halo',
    tags: [T.tactical, T.academy],
    answer: `It means we don't decide at eleven that a child *is* a defender and train only what defenders need. Early position-locking is one of the most common quiet harms in youth football: it narrows a player before they've discovered what they could become, and it usually reflects how big or fast they are *now*, not who they'll be. So through the early years we rotate positions, including within matches, and we build universal foundations — perception, first touch, decision-making, both feet, character — that serve any role. Specialisation is real and it matters, but it should emerge *from* the player as they mature, not get stamped on them by an adult in a hurry.`,
  },
  {
    slug: 'is-it-bad-that-i-get-bored-doing-the-same-drill-over-and-over',
    question: 'Is it bad that I get bored doing the same drill over and over?',
    category: 'player-development',
    audience_layer: 'Player',
    tags: [T.player, T.mental, T.soloPractice],
    answer: `The boredom isn't the problem — losing focus is. Real improvement does ask you to do familiar things many times, and that can feel dull. But the rep only teaches you something if you're fully *in* it: same drill, full attention, trying to do it a little better than last time. A bored, automatic rep teaches almost nothing; a focused one on the five-hundredth touch is what separates players over years. So the answer isn't to chase novelty every session — it's to bring intention to the repetition. If you genuinely can't hold focus, that's a sign to change the *challenge* (add pressure, speed, a constraint), not to abandon the work.`,
  },
  {
    slug: 'how-much-should-my-child-train-each-week-to-keep-up',
    question: 'How much should my child be training each week to keep up?',
    category: 'parent-corner',
    audience_layer: 'Parent',
    tags: [T.parent, T.recovery, T.nutrition],
    answer: `"Keeping up" is the wrong frame, and it's worth letting go of — it leads to doing too much, too young, which is how kids get injured and burn out. What matters more than total hours is the quality of the hours, sleep, and recovery. A young player who loves the game and gets enough rest will outlast one who's drilled to exhaustion to stay "ahead." Free play counts — backyard, street, futsal — often more than another structured session. Watch for the warning signs that matter: dread before sessions, nagging soreness, joy draining away. Protect the sleep and the fun, and the development takes care of itself over the long run.`,
  },
]

// ─── Built objects ──────────────────────────────────────────────────────────

function isoForIndex(i: number): string {
  // Stagger by one minute, newest first for index 0, so curated order is stable.
  const base = new Date(SEED_BASE_ISO).getTime()
  return new Date(base - i * 60_000).toISOString()
}

export const SEED_QUESTIONS: QuestionWithAuthor[] = DEFS.map((d, i) => {
  const id = `seed-q-${i + 1}`
  const answerId = `seed-a-${i + 1}`
  const created = isoForIndex(i)
  return {
    id,
    author_id: COACH_USER_ID,
    title: d.question,
    slug: d.slug,
    body: d.question,
    category: d.category,
    audience_layer: d.audience_layer,
    status: 'published',
    accepted_answer_id: answerId,
    upvote_count: 0,
    answer_count: 1,
    view_count: 0,
    is_pinned: false,
    created_at: created,
    updated_at: created,
    author: COACH_AUTHOR,
    tags: d.tags.map((t) => ({ id: `seed-tag-${t.slug}`, slug: t.slug, label: t.label })),
    viewer_has_upvoted: false,
  }
})

const SEED_ANSWERS: Record<string, AnswerWithAuthor[]> = Object.fromEntries(
  DEFS.map((d, i) => {
    const questionId = `seed-q-${i + 1}`
    const answerId = `seed-a-${i + 1}`
    const created = isoForIndex(i)
    const answer: AnswerWithAuthor = {
      id: answerId,
      question_id: questionId,
      author_id: COACH_USER_ID,
      body: d.answer,
      status: 'published',
      upvote_count: 0,
      created_at: created,
      updated_at: created,
      author: COACH_AUTHOR,
      is_accepted: true,
      viewer_has_upvoted: false,
    }
    return [questionId, [answer]]
  })
)

// ─── Public helpers (used by queries.ts merge) ────────────────────────────────

export function isSeedQuestionId(id: string): boolean {
  return id.startsWith('seed-q-')
}

export interface SeedFilter {
  category?: QuestionCategory
  tagSlug?: string
  search?: string
  authorId?: string
}

/** Curated seed questions matching the same filters getQuestions() applies. */
export function getSeedQuestions(opts: SeedFilter = {}): QuestionWithAuthor[] {
  const { category, tagSlug, search, authorId } = opts
  return SEED_QUESTIONS.filter((q) => {
    if (category && q.category !== category) return false
    if (tagSlug && !q.tags.some((t) => t.slug === tagSlug)) return false
    if (authorId && q.author_id !== authorId) return false
    if (search) {
      const needle = search.toLowerCase()
      const hay = `${q.title}\n${q.body}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

export function getSeedQuestionBySlug(slug: string): QuestionWithAuthor | null {
  return SEED_QUESTIONS.find((q) => q.slug === slug) ?? null
}

export function getSeedAnswers(questionId: string): AnswerWithAuthor[] {
  return SEED_ANSWERS[questionId] ?? []
}

/** Seed question counts keyed by tag slug — to merge into tag question_count. */
export function seedTagCounts(): Map<string, number> {
  const m = new Map<string, number>()
  for (const q of SEED_QUESTIONS) {
    for (const t of q.tags) m.set(t.slug, (m.get(t.slug) ?? 0) + 1)
  }
  return m
}

/** Synthetic public profile for the StunpreX Coach author (no DB row exists). */
export function getCoachProfile(): MemberProfile {
  return {
    user_id: COACH_USER_ID,
    display_name: COACH_DISPLAY_NAME,
    bio: 'The StunpreX Coach voice — calm, evidence-grounded, methodology-first answers to real development questions, drawn from the Codex.',
    avatar_url: null,
    role: 'admin',
    is_banned: false,
    wants_newsletter: false,
    onboarded: true,
    created_at: SEED_BASE_ISO,
    question_count: SEED_QUESTIONS.length,
    answer_count: SEED_QUESTIONS.length,
    recent_questions: SEED_QUESTIONS.slice(0, 5).map((q) => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      category: q.category,
      created_at: q.created_at,
    })),
  }
}

/** Search-index rows for the seed questions (id, title, slug, category, tag_names). */
export function seedSearchIndex(): Array<{
  id: string
  title: string
  slug: string
  category: string
  tag_names: string
}> {
  return SEED_QUESTIONS.map((q) => ({
    id: q.id,
    title: q.title,
    slug: q.slug,
    category: q.category,
    tag_names: q.tags.map((t) => t.label).join(' '),
  }))
}
