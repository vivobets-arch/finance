# FinanceTrack

Mobile-first personal expense tracker (Vite + vanilla JS + Supabase).

Track spending on two credit cards, sync in realtime across phones on the same account, and keep available balance derived from the transaction ledger.

## Features

- Magic-link login (Supabase Auth)
- Two editable cards (nickname + credit limit)
- Available balance calculated from expenses + adjustments
- Category quick-add, description, amount
- Edit / delete transactions
- Manual balance adjustments (audit trail)
- Realtime sync between devices
- Reset all data

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of `supabase/migrations/001_init.sql`
3. Authentication → Providers → Email: enable **Email** and magic link / OTP
4. Authentication → URL configuration: add your app URL to redirect allow-list, e.g.
   - `http://localhost:5173`
   - your production URL
5. Copy **Project URL** and **anon public** key from Project Settings → API

### 3. Environment

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Run

```bash
npm run dev
```

Open the printed local URL on your phone (same Wi‑Fi) or use two browsers to verify realtime sync.

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Local development server |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |

## Architecture

```
src/
  lib/         Supabase client
  services/    Auth, cards, categories, transactions, realtime
  state/       In-memory store
  ui/          Screens & components
  utils/       Money / id helpers
```

Balances are never stored as a source of truth. Per card:

`available = Σ credit amounts − Σ debit amounts` (soft-deleted rows excluded)

## Design docs

- Spec: `docs/superpowers/specs/2026-08-01-finance-track-design.md`
- Plan: `docs/superpowers/plans/2026-08-01-finance-track.md`
