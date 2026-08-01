# FinanceTrack — Design Spec

**Date:** 2026-08-01  
**Status:** Approved for planning  
**Stack:** Vite + vanilla JavaScript modules + Supabase (Auth, Postgres, Realtime)

---

## 1. Purpose

Mobile-first personal expense tracker for one user signed in on two phones. Track spending against two credit cards, sync instantly via Supabase, and keep balances derived from a transaction ledger (not a mutable balance field).

---

## 2. Goals & non-goals

### Goals

- Select a card, pick a category, enter amount/description, add expense quickly on a phone
- Editable card nicknames and credit limits
- Available balance always calculated from transaction history
- Manual balance adjustments with an audit trail
- Magic-link login; data isolated per user (RLS)
- Real-time sync between devices on the same account
- Clean module layout so features can be added later

### Non-goals

- Offline mode, IndexedDB outbox, service worker caching, or PWA offline install
- Multi-user / household sharing (single account on both phones only)
- Budgets, reports, charts, bank imports, multi-currency
- Native mobile apps

---

## 3. Product decisions

| Decision | Choice |
|----------|--------|
| Currency | EUR (€) |
| Cards | Exactly two cards; editable nicknames |
| Balance model | Credit limit + available; available derived from ledger |
| Overspend | Allowed; available may go negative |
| Auth | Supabase magic link (email) |
| Sharing | Same login on both devices |
| Sync conflicts | Client-generated UUID inserts never collide; same-row edits use last-write-wins on `updated_at` |
| Offline | None — online-only |
| Layout | Focused card carousel (one large card, swipe between) |
| Visual | Ocean slate — dark navy, blue→teal cards, teal CTA |

---

## 4. Architecture

```
Browser (Vite SPA)
  ├── ui/          render from store, capture input
  ├── state/       in-memory store + subscribers
  ├── services/    Supabase CRUD + Realtime subscriptions
  └── lib/         Supabase client

Supabase
  ├── Auth (magic link)
  ├── Postgres (cards, categories, transactions)
  └── Realtime (postgres_changes on cards + transactions)
```

- UI never calls Supabase directly; only services do
- Store holds cards, categories, transactions; available balances computed via pure helpers
- No local persistence beyond Supabase Auth session

---

## 5. Data model

All tables include `user_id uuid not null references auth.users` and RLS: `auth.uid() = user_id`.

### 5.1 `cards`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | default `gen_random_uuid()` |
| user_id | uuid | |
| name | text | nickname, e.g. "Visa" |
| credit_limit | numeric(12,2) | display / reference; not used to compute available |
| sort_order | int | 0 and 1 for the two cards |
| created_at | timestamptz | |
| updated_at | timestamptz | for LWW on edits |

### 5.2 `categories`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| user_id | uuid | per-user seed (simple; no shared global table) |
| name | text | Food, Fuel, … |
| icon | text | emoji |
| sort_order | int | |
| created_at | timestamptz | |

Default seed: Food 🍔, Fuel ⛽, Shopping 🛒, Coffee ☕, Entertainment 🎮, Bills 🏠, Other ➕.

### 5.3 `transactions`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | **client-generated** so inserts are conflict-free |
| user_id | uuid | |
| card_id | uuid FK → cards | |
| category_id | uuid FK → categories | nullable for adjustments |
| type | text | `expense` \| `adjustment` |
| direction | text | `debit` \| `credit`; expenses always `debit`; adjustments use either |
| amount | numeric(12,2) | always **positive**; effect from `type` + `direction` |
| description | text | optional for expenses; required for adjustments |
| occurred_at | timestamptz | when the spend/adjustment happened |
| created_at | timestamptz | |
| updated_at | timestamptz | LWW for concurrent edits |
| deleted_at | timestamptz | soft delete; null = active |

**Constraints**

- `type in ('expense', 'adjustment')`
- `direction in ('debit', 'credit')`
- `amount > 0`
- Expenses: `direction = 'debit'` and `category_id` required
- Adjustments: `category_id` null; `description` required

### 5.4 Balance formula

Per card, over rows where `deleted_at is null`:

```
signed(row) = +amount  if direction = 'credit'
            = -amount  if direction = 'debit'

available = Σ signed(row)
```

Equivalently: credits add, debits (including all expenses) subtract.

Credit limit is stored on `cards` for display/reference only. UI may show utilization vs limit; limit is not an input to the formula.

**Do not** store a denormalized `available_balance` column as source of truth.

### 5.5 Manual adjustments (audit trail)

“Set available” to a target:

1. `current =` balance formula for that card  
2. `delta = target - current`  
3. If `delta === 0`, no-op  
4. Else insert `type = 'adjustment'` with `amount = abs(delta)`, `direction = credit` if `delta > 0` else `debit`, and a description (e.g. “Opening balance”, “Payment received”, “Manual correction”)

Payments and corrections always leave a ledger row. Editing or soft-deleting any row changes available on the next recompute.

---

## 6. First-run & seeding

On first authenticated session when the user has zero cards:

1. Insert two cards: “Card 1”, “Card 2”, `credit_limit = 0`, `sort_order` 0/1  
2. Insert default categories  
3. Prompt UI to set each card’s nickname, credit limit, and opening available (opening available → one credit `adjustment` per card when greater than 0)

Reset all data: delete that user’s transactions and cards (and optionally categories), then re-run seed + onboarding prompt.

---

## 7. Project structure

```
FinanceTrack/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── .gitignore
├── supabase/
│   └── migrations/
│       └── 001_init.sql
└── src/
    ├── main.js
    ├── styles/
    │   └── main.css
    ├── lib/
    │   └── supabase.js
    ├── services/
    │   ├── auth.js
    │   ├── cards.js
    │   ├── categories.js
    │   └── transactions.js
    ├── state/
    │   └── store.js
    ├── ui/
    │   ├── auth.js
    │   ├── cards.js
    │   ├── expense-form.js
    │   ├── transaction-list.js
    │   └── settings.js
    └── utils/
        └── money.js
```

---

## 8. UI specification

### 8.1 Login

- Email input + “Send magic link”
- Confirmation state: “Check your email”
- After redirect/session: enter main app

### 8.2 Main — card carousel

- One large gradient card showing: nickname, available (EUR), credit limit, position (1/2)
- Swipe or control to switch selected card (selected card is the one charged on Add)
- Tap card opens editor: name, credit limit, “Set available” (creates adjustment delta vs current)

### 8.3 Expense form

- Category icon row (required selection)
- Description text field (optional)
- Large amount field
- Primary **Add** button (disabled while submitting)
- On success: clear amount/description; keep category and selected card; list + balances update (local store + Realtime)

### 8.4 Transaction list

- Recent first (`occurred_at` desc)
- Show icon/category, description, card name, signed amount, date
- Tap → edit amount/description/category/card or soft-delete
- Adjustments visually distinct (e.g. “Adjustment” label, credit styling)

### 8.5 Settings

- Sign out
- Reset all data (confirm)

### 8.6 Visual design

- Ocean slate: dark navy background (`#0b1220` range), blue→teal card gradient, teal CTA
- Large touch targets (≥44px), mobile-first spacing
- Expressive but readable UI fonts (not default Inter/Roboto/Arial stacks as the sole identity — pick a distinctive pair via Google Fonts, e.g. display + clean sans for amounts)

---

## 9. Realtime & concurrency

- Subscribe to `postgres_changes` on `cards` and `transactions` filtered by `user_id`
- On event: patch or reload affected collections in the store; recompute balances
- Inserts: client UUID → no primary-key conflict
- Updates: send `updated_at`; last writer wins
- Soft deletes: set `deleted_at`; exclude from queries and balance math

---

## 10. Error handling

- Auth/network failures → non-blocking banner/toast
- Invalid amount (empty, ≤ 0, non-numeric) → inline validation; do not submit
- Missing category → inline validation
- In-flight Add disables button to prevent double submit
- Supabase errors surfaced in plain language

---

## 11. Environment & setup

`.env` (Vite):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Document in README: create Supabase project, run migrations, enable magic-link auth, enable Realtime for `cards` and `transactions`.

---

## 12. Testing (manual)

- Magic link login on two browsers/phones
- Add expense on device A → appears on B with updated available
- Edit/delete on A → reflected on B
- Set available via adjustment → ledger row visible; balance matches formula
- Overspend → negative available shown
- Reset → empty seeded state
- Refresh page → session + data restored from Supabase

---

## 13. Implementation phases (for planning)

1. Scaffold Vite app + env + styles tokens (ocean slate)
2. Supabase migration (tables, RLS, Realtime)
3. Auth UI + session gate
4. Seed + store + balance helpers
5. Card carousel + edit card / set available
6. Expense form + transaction list + edit/delete
7. Settings (sign out, reset)
8. Realtime subscriptions
9. Manual QA on two devices
