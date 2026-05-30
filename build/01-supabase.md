# 01 — Supabase Schema

## GOAL

Three tables created in your Supabase Postgres database with row-level security on, and a working Supabase client in your React app.

> **Note (2026-05-29):** Progress photos are no longer uploaded — the daily photo is a self-reported `photo_taken` boolean (friends share pics in iMessage). No storage bucket. See `reference/decisions.md`.

---

## STEPS

### 1. Run the schema migration

In Supabase dashboard → SQL Editor → New query → paste this whole block → Run:

```sql
-- USERS
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_seed text not null,
  start_date date not null,
  current_day int not null default 1,
  status text not null default 'active' check (status in ('active', 'failed', 'completed')),
  sfx_enabled boolean not null default true,
  reminder_time time,
  created_at timestamptz not null default now()
);

-- DAILY LOGS
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_number int not null check (day_number between 1 and 75),
  log_date date not null,
  workout_1 boolean not null default false,
  workout_2_outdoor boolean not null default false,
  diet boolean not null default false,
  reading_pages int not null default 0,
  water_count int not null default 0 check (water_count between 0 and 3),
  photo_taken boolean not null default false,
  no_alcohol boolean not null default true,
  sleep_hours numeric(3,1) not null default 0,
  all_complete boolean generated always as (
    workout_1 and workout_2_outdoor and diet
    and reading_pages >= 10 and water_count >= 3
    and photo_taken and no_alcohol
    and sleep_hours >= 8
  ) stored,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- REACTIONS
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.daily_logs(id) on delete cascade,
  from_user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '💗')),
  created_at timestamptz not null default now(),
  unique (log_id, from_user_id)
);

-- ENABLE RLS
alter table public.users enable row level security;
alter table public.daily_logs enable row level security;
alter table public.reactions enable row level security;
```

### 2. Run the RLS policies

New SQL query → paste → Run:

```sql
-- USERS: everyone in the group sees everyone, only you edit yourself
create policy "anyone authenticated can read users"
  on public.users for select
  to authenticated using (true);

create policy "users insert themselves on signup"
  on public.users for insert
  to authenticated with check (id = auth.uid());

create policy "users update themselves"
  on public.users for update
  to authenticated using (id = auth.uid());

-- DAILY LOGS: read all, write only your own
create policy "anyone authenticated reads logs"
  on public.daily_logs for select
  to authenticated using (true);

create policy "users insert their own logs"
  on public.daily_logs for insert
  to authenticated with check (user_id = auth.uid());

create policy "users update their own logs"
  on public.daily_logs for update
  to authenticated using (user_id = auth.uid());

-- REACTIONS: read all, write only your own
create policy "anyone authenticated reads reactions"
  on public.reactions for select
  to authenticated using (true);

create policy "users react as themselves"
  on public.reactions for insert
  to authenticated with check (from_user_id = auth.uid());

create policy "users delete their own reactions"
  on public.reactions for delete
  to authenticated using (from_user_id = auth.uid());
```

### 3. Wire up the Supabase client in React

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 4. Smoke test the connection

Edit `src/App.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [status, setStatus] = useState('checking...');
  useEffect(() => {
    supabase.from('users').select('count').then(({ error }) => {
      setStatus(error ? `ERROR: ${error.message}` : 'CONNECTED');
    });
  }, []);
  return <div style={{padding: 40, fontFamily: 'monospace'}}>Supabase: {status}</div>;
}
```

Run `npm run dev`. You should see `Supabase: CONNECTED`. If you see an error about RLS, that's actually good — it means the connection works but the unauthenticated session can't read users (which is correct behavior — RLS is on).

If you see `CONNECTED`, you're done.

---

## DONE WHEN

- [ ] All 3 tables visible in Supabase Table Editor
- [ ] RLS is enabled (lock icon next to each table name in dashboard)
- [ ] Smoke test prints `Supabase: CONNECTED` (or an RLS error, which means connected + secured)

---

## GOTCHAS

- If you forget the `enable row level security` lines, your data is publicly readable and writable. Verify the lock icon.
- The `daily_logs.unique (user_id, log_date)` constraint means each user can only have one log per day. If you ever want to "test reset" a day, you have to delete the existing row first.

---

## NEXT

`build/02-design-system.md` — palette, fonts, NES.css overrides, sound effects, the reusable component patterns.
