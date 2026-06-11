# Data architecture for minors — design note

**Scope:** how StunpreX accounts, consent, and training-progress data are
structured so that players below the digital consent age can use the platform
lawfully and safely. Schema: `db/migrations/004_accounts_progress_schema.sql`.

---

## 1. Parent-anchor account model

A player below the consent age never holds a standalone account. The anchor is
the **parent account**:

1. Parent signs up normally (`users.profile_type = 'parent'`) and accepts
   terms + privacy for themselves (`consent_records`: `terms`, `privacy`).
2. Parent creates (or approves) the player account. This produces a
   `parent_player_links` row, `status = 'pending'`.
3. Parent grants parental consent for the player. Two records result:
   - `consent_records` row with `consent_type = 'parental'`,
     `user_id = player`, `granted_by_user_id = parent`, plus the
     `policy_version` consented to;
   - the link flips to `status = 'active'` with `consent_granted_at` set.
4. Withdrawal is first-class: the link goes to `status = 'revoked'`. A revoked
   link suspends the player account's activity; consent records are
   append-only audit history and are never edited or deleted.

A player at or above the consent age signs up directly; no link is required.
Players can have more than one linked parent/guardian; the unique constraint
is per (parent, player) pair.

## 2. Age gate at signup

Signup asks for **birth year only** (`users.birth_year`) and country
(`users.country_code`). Birth year against country consent age decides the
path: direct account, or parent-anchor flow. Borderline years (the gate cannot
distinguish months) are treated as below the consent age — the conservative
path.

## 3. Per-country consent ages

`users.country_code` (ISO 3166-1 alpha-2) selects the digital consent age:

| Region | Age used |
|---|---|
| EU / EEA | **16** (single floor for simplicity — several member states allow 13–15; we deliberately do not maintain a per-member-state table at launch) |
| United Kingdom | 13 |
| United States | 13 (COPPA) |
| Anywhere else / unknown | 16 (conservative default) |

## 4. What we deliberately do NOT collect

- **Full date of birth** — birth year only, everywhere.
- **Geolocation** — country code only, self-declared, used solely for the
  consent-age rule.
- **Free-text health or medical data** — no fields for it; `metrics` is for
  training counts, `note` guidance explicitly excludes health information.
- IP addresses, school, club identity, or any contact data beyond the email
  used for auth.

If a future feature seems to need more, the default answer is no until a DPIA
says otherwise (§6).

## 5. Mapping to the Annual Development Review

`training_sessions` and `progression_events` are designed so the future Annual
Development Review can be computed without collecting anything new:

- **Sessions count** — rows per player per period (`player_user_id`,
  `session_date` index).
- **Activity distribution** — `activity_type` follows the Activity-Capacity
  Matrix categories (`organised`, `ssg`, `match`, `futsal`, `free`, `solo`,
  `video`, `mental`); the review aggregates time and counts per category.
- **Capacity distribution** — `capacity_tags` carries the six capacity
  families (Perceptual, Cognitive, Motor, Communication, Affective, Adaptive);
  the review shows balance across families, not a single score.
- **Leading indicators** — `metrics` (jsonb) holds touches, scans, decisions,
  weak-foot reps, scans-per-piece per session; the review trends them. They
  are process indicators, never a verdict on the player.
- **Streaks** — derivable from `session_date` continuity; no extra column.
- **Progression milestones** — `progression_events` (`event_type` + `payload`)
  is the timeline the review narrates over the long horizon.

## 6. Exposure and process guardrails

- **No public exposure of minors' data.** Training data, progress, milestones,
  birth year, and parent links are never public, never in community profiles,
  never in leaderboards. Visibility is the player and their linked
  parent(s)/guardian(s) only.
- **No ranking or talent-ID use.** The data serves the player's own
  development view — the Codex refuses talent-spotting culture, and the schema
  carries no comparison surface between players.
- **DPIA before launch.** A Data Protection Impact Assessment is required
  before any feature built on these tables goes live — processing minors'
  data at scale is exactly the case DPIAs exist for. The DPIA, not this note,
  is the authority on lawful basis, retention periods, and deletion flows.
