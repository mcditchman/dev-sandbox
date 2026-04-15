# Uncle Hotdog IQ Results Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default landing page with a joke IQ results page for Uncle Hotdog, backed by a Supabase counter that increments when visitors click "I confirm Uncle Hotdog is dumb."

**Architecture:** A Server Component (`page.tsx`) fetches the current count from Supabase on each render and passes it to a `'use client'` button component. The button calls `POST /api/confirm`, which increments a single-row counter table and returns the new count.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (`@supabase/ssr` v0.10), TypeScript, Tailwind CSS v4

---

## Prerequisites

Before starting, ensure:
- `supabase start` is running (requires Docker) — the local Supabase stack must be up
- `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (run `vercel env pull .env.local` if not)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260415000000_create_roast_confirmations.sql` | DB schema + seed |
| Regenerate | `src/types/database.types.ts` | TypeScript types from local DB |
| Create | `src/app/api/confirm/route.ts` | POST handler — increments counter |
| Create | `src/components/ConfirmButton.tsx` | Client component — button + count display |
| Modify | `src/app/page.tsx` | Server component — fetches count, renders UI |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260415000000_create_roast_confirmations.sql`

- [ ] **Step 1.1: Write the migration file**

Create `supabase/migrations/20260415000000_create_roast_confirmations.sql`:

```sql
create table roast_confirmations (
  id integer primary key,
  count integer not null default 0
);

-- Seed the single row the app expects
insert into roast_confirmations (id, count) values (1, 0);
```

- [ ] **Step 1.2: Apply the migration to the local Supabase instance**

```bash
supabase db push
```

Expected output: something like `Applying migration 20260415000000_create_roast_confirmations.sql... done`

If you get a connection error, make sure `supabase start` is running first.

- [ ] **Step 1.3: Verify the table exists**

```bash
supabase db diff
```

Expected: no diff output (local DB matches migrations).

- [ ] **Step 1.4: Commit**

```bash
git add supabase/migrations/20260415000000_create_roast_confirmations.sql
git commit -m "feat: add roast_confirmations migration"
```

---

## Task 2: Regenerate TypeScript Types

**Files:**
- Regenerate: `src/types/database.types.ts`

> **Why:** `database.types.ts` is auto-generated from the local DB schema. After any migration, regenerate it so TypeScript knows about the new table. Never hand-edit this file.

- [ ] **Step 2.1: Generate types from the local DB**

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

- [ ] **Step 2.2: Verify the new table appears in the generated file**

Open `src/types/database.types.ts` and confirm you can find `roast_confirmations` with rows like:

```typescript
roast_confirmations: {
  Row: {
    count: number
    id: number
  }
  Insert: {
    count?: number | null
    id: number
  }
  Update: {
    count?: number | null
    id?: number | null
  }
  // ...
}
```

- [ ] **Step 2.3: Commit**

```bash
git add src/types/database.types.ts
git commit -m "chore: regenerate database types"
```

---

## Task 3: API Route — POST /api/confirm

**Files:**
- Create: `src/app/api/confirm/route.ts`

> **How API routes work in Next.js App Router:** Export named async functions matching HTTP methods (`GET`, `POST`, etc.) from a file at `src/app/api/<name>/route.ts`. Next.js automatically wires them up. The server Supabase client (`src/lib/supabase/server.ts`) handles auth via cookies — always use it in API routes, never the browser client.

- [ ] **Step 3.1: Create the API route file**

Create `src/app/api/confirm/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  // Fetch current count
  const { data: current, error: fetchError } = await supabase
    .from('roast_confirmations')
    .select('count')
    .eq('id', 1)
    .single()

  if (fetchError || current === null) {
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 })
  }

  // Increment and save
  const { data: updated, error: updateError } = await supabase
    .from('roast_confirmations')
    .update({ count: current.count + 1 })
    .eq('id', 1)
    .select('count')
    .single()

  if (updateError || updated === null) {
    return NextResponse.json({ error: 'Failed to update count' }, { status: 500 })
  }

  return NextResponse.json({ count: updated.count })
}
```

- [ ] **Step 3.2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see `Property 'roast_confirmations' does not exist`, Task 2 (type generation) didn't complete — rerun it.

- [ ] **Step 3.3: Smoke-test the route manually**

With `npm run dev` running in another terminal, hit the endpoint:

```bash
curl -X POST http://localhost:3000/api/confirm
```

Expected response: `{"count":1}`

Call it again — expected: `{"count":2}`

- [ ] **Step 3.4: Commit**

```bash
git add src/app/api/confirm/route.ts
git commit -m "feat: add POST /api/confirm route"
```

---

## Task 4: ConfirmButton Client Component

**Files:**
- Create: `src/components/ConfirmButton.tsx`

> **Why `'use client'`:** This component needs React state (`useState`) to track whether the user has clicked and to update the displayed count. Anything with interactivity or browser APIs needs `'use client'`. The server-fetched `initialCount` is passed in as a prop — the Server Component does the DB call, this component just receives the result.

- [ ] **Step 4.1: Create the component**

Create `src/components/ConfirmButton.tsx`:

```typescript
'use client'

import { useState } from 'react'

interface ConfirmButtonProps {
  initialCount: number
}

export default function ConfirmButton({ initialCount }: ConfirmButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [confirmed, setConfirmed] = useState(false)

  async function handleConfirm() {
    const res = await fetch('/api/confirm', { method: 'POST' })
    const data = await res.json()
    setCount(data.count)
    setConfirmed(true)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-white/70 text-sm">
        {count} {count === 1 ? 'person agrees' : 'people agree'} Uncle Hotdog is dumb
      </p>
      <button
        onClick={handleConfirm}
        disabled={confirmed}
        className="px-8 py-3 rounded-full bg-white text-purple-700 font-semibold text-sm
                   hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        {confirmed ? 'Confirmed ✓' : 'I confirm Uncle Hotdog is dumb'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4.2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/ConfirmButton.tsx
git commit -m "feat: add ConfirmButton client component"
```

---

## Task 5: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

> **How Server Components fetch data:** No `useEffect`, no `fetch` in the browser — just `await` at the top level of an `async` function component. Next.js runs this on the server at request time, so the data is already in the HTML by the time it reaches the browser. The `createClient()` from `src/lib/supabase/server.ts` is async (it awaits `cookies()`), so you must `await` it.

- [ ] **Step 5.1: Replace page.tsx**

Overwrite `src/app/page.tsx` with:

```typescript
import { createClient } from '@/lib/supabase/server'
import ConfirmButton from '@/components/ConfirmButton'

export default async function Home() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('roast_confirmations')
    .select('count')
    .eq('id', 1)
    .single()

  const count = data?.count ?? 0

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-6">
      <div className="flex flex-col items-center gap-8 text-center text-white max-w-md w-full">

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">
            Your IQ Results Are In
          </p>
          <p className="text-xs text-white/50">Uncle Hotdog · Official Assessment</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-9xl font-bold leading-none">12</span>
          <span className="text-white/60 text-sm">out of a possible 200</span>
        </div>

        <div className="w-full bg-white/20 rounded-full h-3">
          <div className="bg-red-400 h-3 rounded-full" style={{ width: '6%' }} />
        </div>

        <blockquote className="bg-white/10 rounded-2xl px-6 py-4 text-white/90 italic text-base leading-relaxed">
          &ldquo;Clinically remarkable. We&apos;ve never seen this before.&rdquo;
        </blockquote>

        <ConfirmButton initialCount={count} />

      </div>
    </main>
  )
}
```

- [ ] **Step 5.2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.3: Build check**

```bash
npm run build
```

Expected: build completes with no errors. If you see warnings about unused imports from the old `page.tsx` (like `Image` from `next/image`), they are gone — the new file doesn't import them.

- [ ] **Step 5.4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace landing page with Uncle Hotdog IQ results"
```

---

## Task 6: Manual End-to-End Verification

- [ ] **Step 6.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 6.2: Open http://localhost:3000**

Verify:
- Purple-to-indigo gradient background
- Score "12" displayed large
- Red progress bar ~6% wide
- Pull quote visible
- Count shows current DB value (e.g. "2 people have confirmed this" if you used curl in Task 3)
- Button reads "I confirm Uncle Hotdog is dumb"

- [ ] **Step 6.3: Click the button**

Verify:
- Count increments by 1
- Button text changes to "Confirmed ✓"
- Button is disabled (can't click again)

- [ ] **Step 6.4: Reload the page**

Verify:
- The new count persists (it's coming from Supabase, not just local state)
- Button is re-enabled (state resets on new page load — each visit gets a fresh session)

- [ ] **Step 6.5: Open in a second browser tab**

Click confirm in the second tab. Verify the count goes up by 1 again, confirming multiple visitors can each add to the shared total.

---

## Done

The full stack is wired: Server Component → Supabase read → props → Client Component → fetch → API Route → Supabase write → response → state update.

To deploy: `git push origin master` — Vercel auto-deploys. Run `supabase db push` separately to apply the migration to the remote Supabase project.
