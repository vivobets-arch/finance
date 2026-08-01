# FinanceTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Vite + vanilla JS expense tracker backed by Supabase Auth, Postgres, and Realtime.

**Architecture:** SPA with `ui/` → `state/store` → `services/` → Supabase. Available balance is always derived from the transaction ledger. No offline layer.

**Tech Stack:** Vite, vanilla ES modules, `@supabase/supabase-js`, Supabase (magic link, Postgres RLS, Realtime)

## Global Constraints

- Currency: EUR only
- Exactly two cards per user; editable nicknames + credit_limit
- Balance: `Σ credit amounts − Σ debit amounts` (soft-deleted excluded)
- Overspend allowed (negative available)
- Auth: magic link only; RLS `auth.uid() = user_id`
- Online-only; Realtime on `cards` + `transactions`
- Layout: card carousel; Visual: ocean slate
- Client-generated UUID for transaction inserts; LWW via `updated_at` on edits

---

### Task 1: Scaffold Vite project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.env.example`, `.gitignore`, `README.md`
- Create: `src/main.js`, `src/styles/main.css`

- [ ] Init npm + vite + `@supabase/supabase-js`
- [ ] Wire `index.html` → `/src/main.js` + CSS
- [ ] Add ocean-slate CSS variables and base mobile layout shell (`#app`)
- [ ] Verify: `npm run dev` serves empty shell

### Task 2: Supabase migration

**Files:**
- Create: `supabase/migrations/001_init.sql`

- [ ] Create `cards`, `categories`, `transactions` with columns from spec (incl. `direction`, soft delete)
- [ ] RLS policies for select/insert/update/delete per `user_id`
- [ ] Enable Realtime publication for `cards` and `transactions`
- [ ] Indexes on `(user_id)`, `(card_id)`, `(occurred_at desc)`

### Task 3: Core lib, money utils, store

**Files:**
- Create: `src/lib/supabase.js`, `src/utils/money.js`, `src/utils/id.js`, `src/state/store.js`

- [ ] Supabase client from `import.meta.env`
- [ ] `formatEUR`, `availableForCard(cardId, transactions)`, `parseAmount`
- [ ] Store: `{ user, cards, categories, transactions, selectedCardIndex, selectedCategoryId, status, error }` + `subscribe`/`setState`

### Task 4: Services

**Files:**
- Create: `src/services/auth.js`, `cards.js`, `categories.js`, `transactions.js`, `bootstrap.js`, `realtime.js`

- [ ] Magic link signIn / signOut / getSession / onAuthStateChange
- [ ] CRUD cards; seed two cards if none
- [ ] Seed categories if none
- [ ] Transactions: list, insert (client UUID), update, softDelete
- [ ] `ensureSeeded(userId)` for first run
- [ ] Realtime channel → reload or patch store

### Task 5: Auth UI + app shell

**Files:**
- Create: `src/ui/auth.js`, `src/ui/toast.js`, `src/ui/app.js`
- Modify: `src/main.js`

- [ ] Login form (email + send link)
- [ ] Gate: no session → auth; session → load data + main UI
- [ ] Toast/banner for errors

### Task 6: Cards carousel + editor

**Files:**
- Create: `src/ui/cards.js`, `src/ui/card-editor.js`

- [ ] One large card; swipe / prev-next; dots 1/2
- [ ] Show available (computed) + limit
- [ ] Editor modal: name, credit_limit, set available (adjustment delta)

### Task 7: Expense form + transaction list + settings

**Files:**
- Create: `src/ui/expense-form.js`, `src/ui/transaction-list.js`, `src/ui/transaction-editor.js`, `src/ui/settings.js`

- [ ] Category icons, description, amount, Add
- [ ] Recent list; edit/delete
- [ ] Settings: sign out, reset all (confirm → delete rows → reseed)

### Task 8: Polish + README

- [ ] Touch-friendly styles, negative balance styling, empty states
- [ ] README: Supabase setup, env, magic link redirect URL, migrations, `npm run dev`

**Execution note:** User requested no further confirmations — implement all tasks inline in one pass.
