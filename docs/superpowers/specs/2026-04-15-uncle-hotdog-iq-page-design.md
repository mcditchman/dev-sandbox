# Uncle Hotdog IQ Results Page — Design Spec

## Overview

Replace the default Next.js landing page with a joke "IQ test results" page for Uncle Hotdog. Slick, modern aesthetic (BuzzFeed-style quiz results). Includes a Supabase-backed confirmation counter: visitors click a button to register their agreement that Uncle Hotdog is dumb, incrementing a shared count stored in the DB.

Primary purpose: joke page to send to a friend. Secondary purpose: learning exercise demonstrating the full Next.js + Supabase integration pattern.

---

## Architecture

### Page — `src/app/page.tsx`

- Server Component (no `'use client'`)
- On render, fetches current `count` from Supabase using the server client (`src/lib/supabase/server.ts`)
- Renders the full IQ results UI, passing `count` as a prop to `<ConfirmButton>`
- No client-side JS on the page itself

### Confirmation Button — `src/components/ConfirmButton.tsx`

- `'use client'` component
- Props: `initialCount: number`
- Local state: `count` (initialized from `initialCount`), `confirmed: boolean`
- On click: calls `POST /api/confirm`, reads new count from response, updates state, sets `confirmed = true`, disables button
- Button label before click: `"I confirm Uncle Hotdog is dumb"`
- Button label after click: `"Confirmed ✓"`
- Displays count as: `"{count} people agree Uncle Hotdog is dumb"`

### API Route — `src/app/api/confirm/route.ts`

- Exports `POST` handler
- Uses server Supabase client to increment `count` on the single row (`id = 1`) in `roast_confirmations`
- Returns `{ count: number }` JSON
- No auth required (public)

---

## Database

### Table: `roast_confirmations`

| column  | type    | notes                  |
|---------|---------|------------------------|
| `id`    | integer | primary key, value = 1 |
| `count` | integer | default 0              |

Single row, never deleted. The API route uses Supabase's `.update()` with `.eq('id', 1)`.

### Migration

Created via: `supabase db diff --use-migra -f create_roast_confirmations`

Seed the single row in the migration SQL so the table is ready immediately after applying.

---

## UI Design

Style: gradient background (purple to indigo), white text, rounded card. Mirrors the "slick modern" mockup (option C from brainstorm).

Key elements top to bottom:
1. Small label: `"YOUR IQ RESULTS ARE IN"`
2. Giant score: `12` (out of 200)
3. Progress bar — filled ~6% in red/coral
4. Pull quote: `"Clinically remarkable. We've never seen this before."`
5. Confirmation count + button

---

## What This Teaches

| Concept | Where |
|---|---|
| Server Component data fetch | `page.tsx` → Supabase server client |
| `'use client'` component with state | `ConfirmButton.tsx` |
| API Route (POST handler) | `/api/confirm/route.ts` |
| Supabase server client in API route | `createClient()` from `server.ts` |
| DB migration + seed | `supabase/migrations/` |
| TypeScript types from Supabase | `database.types.ts` (regenerated after migration) |
