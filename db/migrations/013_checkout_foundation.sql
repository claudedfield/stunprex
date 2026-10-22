-- 013: the checkout's foundation (the owner's word of 22 Oct 2026; nothing is sold until the sales
-- terms and the membership lines on /privacy are live, D-LEGAL-17, and CHECKOUT_OPEN=1).
--
-- purchase_codes: the six-digit code mailed to the account's address before a checkout, before a
--   membership starts and before a change of plan (Legal's condition 2, LEGAL-0039). Not at renewal.
--   A row holds the account, what the code is for, a hash of the code, attempts, and when it was
--   used and then spent on the purchase step. Rows are deleted after 24 hours.
-- stripe_customers: which Stripe customer belongs to which account. No card data is ever ours.
-- memberships: the membership state Stripe reports by webhook (status, plan, period end).
-- purchases: one-time purchases (plan packs) with treatment B's tick: when the buyer ticked the one
--   box, the label's version, and when the confirmation email was sent (Legal, D-LEGAL-34). Kept
--   under the billing rule (at least 8 years).
-- stripe_events: the id of every webhook event handled, so a repeat changes nothing.

CREATE TABLE IF NOT EXISTS purchase_codes (
  id          text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     text        NOT NULL,
  intent      text        NOT NULL,
  code_hash   text        NOT NULL,
  attempts    integer     NOT NULL DEFAULT 0,
  used_at     timestamptz,
  spent_at    timestamptz,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchase_codes_user_idx ON purchase_codes (user_id, created_at);

CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id     text        NOT NULL PRIMARY KEY,
  customer_id text        NOT NULL UNIQUE,
  livemode    boolean     NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  subscription_id    text        NOT NULL PRIMARY KEY,
  user_id            text        NOT NULL,
  lookup_key         text        NOT NULL,
  status             text        NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean   NOT NULL DEFAULT false,
  livemode           boolean     NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships (user_id);

CREATE TABLE IF NOT EXISTS purchases (
  id                 text        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id            text        NOT NULL,
  checkout_session   text        NOT NULL UNIQUE,
  lookup_key         text        NOT NULL,
  amount_total       integer     NOT NULL,
  currency           text        NOT NULL,
  paid_at            timestamptz NOT NULL,
  download_ticked_at timestamptz,
  tick_label_version text,
  confirmation_sent_at timestamptz,
  refunded_at        timestamptz,
  livemode           boolean     NOT NULL
);
CREATE INDEX IF NOT EXISTS purchases_user_idx ON purchases (user_id);

CREATE TABLE IF NOT EXISTS stripe_events (
  id          text        NOT NULL PRIMARY KEY,
  type        text        NOT NULL,
  handled_at  timestamptz NOT NULL DEFAULT now()
);
