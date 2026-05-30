# Supabase To-Do — things only you can do (dashboard / SQL editor)

I have only the client anon key, so these all need you in the Supabase dashboard.
Ordered by priority. Each is copy-paste-ready.

---

## 0. 🔴 RUN NOW — species column migration

The app now uses a **species** identity (rhino/otter/giraffe/cat) instead of the
old Dicebear avatar. Until this runs, `users` has no `species` column and
onboarding / profile saves will fail. **SQL Editor → New query → Run:**

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS species text;
UPDATE public.users SET species = 'rhino' WHERE species IS NULL;   -- migrate existing rows
ALTER TABLE public.users ALTER COLUMN species SET NOT NULL;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_species_check;
ALTER TABLE public.users ADD CONSTRAINT users_species_check
  CHECK (species IN ('rhino', 'otter', 'giraffe', 'cat'));
-- avatar_seed column is kept (still NOT NULL) but no longer used; onboarding writes ''.
```

After it runs: your existing profile becomes `rhino`; change it any time in the
ME tab. (Sprite stage cub→sprout→beast and the tavern build are driven by your
real day = `daysSince(start_date)`, not the stale `current_day` column.)

---

## 1. 🔴 REQUIRED before inviting anyone — security hardening

Without this, **anyone who finds the deployed URL can join and read everyone's
data.** Open **SQL Editor → New query**, edit the email list, Run.

```sql
-- ============================================================
-- 75 HARD — security hardening (allowlist + members-only reads + reactions UPDATE)
-- ============================================================

create table if not exists public.allowed_emails (email text primary key);
alter table public.allowed_emails enable row level security;  -- no policies => private

-- >>> EDIT: one row per friend, lowercase <<<
insert into public.allowed_emails (email) values
  ('jordansdevicesinfo@gmail.com')
  -- ,('friend2@example.com')
  -- ,('friend3@example.com')
  -- ,('friend4@example.com')
on conflict do nothing;

create or replace function public.is_member()
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid());
$$;

create or replace function public.is_email_allowed(addr text)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from public.allowed_emails where email = lower(addr));
$$;

drop policy if exists "anyone authenticated can read users" on public.users;
create policy "members read users" on public.users
  for select to authenticated using (public.is_member() or id = auth.uid());

drop policy if exists "anyone authenticated reads logs" on public.daily_logs;
create policy "members read logs" on public.daily_logs
  for select to authenticated using (public.is_member());

drop policy if exists "anyone authenticated reads reactions" on public.reactions;
create policy "members read reactions" on public.reactions
  for select to authenticated using (public.is_member());

drop policy if exists "users insert themselves on signup" on public.users;
create policy "allowlisted users insert themselves" on public.users
  for insert to authenticated
  with check (id = auth.uid() and public.is_email_allowed(email));

drop policy if exists "users update their own reactions" on public.reactions;
create policy "users update their own reactions" on public.reactions
  for update to authenticated using (from_user_id = auth.uid());
```

After running: delete your `users` row and do one full onboarding to confirm the
profile insert still works. (Reaction-swap 🔥↔💗 also depends on this block — the
UPDATE policy at the bottom.)

---

## 2. 🟡 Recommended — server-side numeric guards (Q3)

The app now clamps these client-side; this enforces it at the database too.

```sql
alter table public.daily_logs
  add constraint reading_pages_sane check (reading_pages between 0 and 9999),
  add constraint sleep_hours_sane  check (sleep_hours   between 0 and 24);
```

---

## 3. 🟢 Optional — live reactions across devices (Q5)

Makes 🔥/💗 update in real time on a second device. Without it, reactions still
work (the app refreshes after each tap).

- Dashboard → **Database → Replication** → enable the `reactions` table, **or**
- (newer UI) Dashboard → **Database → Publications → `supabase_realtime`** → add
  the `reactions` table.

---

## Already done (for reference)
- ✅ Schema + RLS (step 01)
- ✅ Email auth + custom Gmail SMTP (step 03)
- ✅ Your profile row exists
