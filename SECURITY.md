# Security & Quality Review

Review of the 75 Hard app as of steps 00–08, public repo + Supabase backend.
Findings are ranked as a severity ladder. Security items have ready-to-run
remediation SQL (I can't run DB DDL — only the client anon key — so you apply it
in the Supabase SQL Editor). QoL items are documented for you to pick from.

---

## Severity ladder

| # | Severity | Area | Finding | Status |
|---|----------|------|---------|--------|
| S1 | **HIGH** | Access control | Anyone on the internet with the deployed URL can sign in via magic-link and join the party — read everyone's logs, react, etc. No allowlist. | Fix ready (SQL §1) |
| S2 | **MEDIUM** | Privacy / RLS | Any authenticated session (even one with no profile) can read all `users`, `daily_logs`, `reactions`. Reads aren't gated on membership. | Fix ready (SQL §1) |
| S3 | **MEDIUM** | Correctness / RLS | `reactions` has no UPDATE policy, but swapping 🔥↔💗 is an upsert→UPDATE → silently blocked by RLS. Functional bug *and* an RLS gap. | Fix ready (SQL §1) |
| S4 | LOW | Privacy | `users.email` is readable by all members. Fine for 4 friends who know each other; noted for completeness. | Accepted |
| S5 | LOW | Input | `reading_pages` / `sleep_hours` have no server-side upper bound. Only affects the user's own log. | Accepted |
| ✅ | PASS | Secrets | No keys/project-ref/SMTP password in the public repo. `.env.local` gitignored; anon key only in local env + Cloudflare. | — |
| ✅ | PASS | Key exposure | Anon/publishable key is a client key, protected by RLS. Public exposure is by design. | — |
| ✅ | PASS | XSS | React escapes all rendered user content (`display_name` etc.); no `dangerouslySetInnerHTML`. | — |

---

## §1 — Security remediation (RUN BEFORE INVITING FRIENDS)

One block in the **Supabase SQL Editor**. The only thing you edit is the email
list in step 1. It closes S1, S2, and S3 together.

```sql
-- ============================================================
-- 75 HARD — security hardening
-- ============================================================

-- 1) ALLOWLIST TABLE (RLS on, no policies => not readable via the API)
create table if not exists public.allowed_emails (email text primary key);
alter table public.allowed_emails enable row level security;

-- >>> EDIT: one row per friend, lowercase <<<
insert into public.allowed_emails (email) values
  ('jordansdevicesinfo@gmail.com')
  -- ,('friend2@example.com')
  -- ,('friend3@example.com')
  -- ,('friend4@example.com')
on conflict do nothing;

-- 2) SECURITY-DEFINER helpers (bypass RLS cleanly; avoid policy recursion)
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

-- 3) READS = MEMBERS ONLY (your own user row is always readable, for onboarding)
drop policy if exists "anyone authenticated can read users" on public.users;
create policy "members read users" on public.users
  for select to authenticated
  using (public.is_member() or id = auth.uid());

drop policy if exists "anyone authenticated reads logs" on public.daily_logs;
create policy "members read logs" on public.daily_logs
  for select to authenticated
  using (public.is_member());

drop policy if exists "anyone authenticated reads reactions" on public.reactions;
create policy "members read reactions" on public.reactions
  for select to authenticated
  using (public.is_member());

-- 4) PROFILE CREATION = ALLOWLISTED EMAILS ONLY (closes S1)
drop policy if exists "users insert themselves on signup" on public.users;
create policy "allowlisted users insert themselves" on public.users
  for insert to authenticated
  with check (id = auth.uid() and public.is_email_allowed(email));

-- 5) FIX S3: reactions were missing an UPDATE policy (swap 🔥<->💗)
drop policy if exists "users update their own reactions" on public.reactions;
create policy "users update their own reactions" on public.reactions
  for update to authenticated
  using (from_user_id = auth.uid());
```

**Effect:** a non-allowlisted person can still *authenticate* (gets an `auth.users`
row), but cannot create a profile and cannot read any logs/users/reactions — they
land on onboarding, the final insert is denied, and they see nothing. To add a
friend later: `insert into public.allowed_emails (email) values ('new@friend.com');`

**One thing to verify after applying:** complete a fresh onboarding (delete your
`users` row, re-onboard). If the final insert errors, it's the insert-RETURNING
interacting with the members-read policy — tell me and I'll adjust. (The
`or id = auth.uid()` clause on the users-read policy is there specifically to
prevent that.)

---

## §2 — Quality-of-life backlog (documented, not yet applied)

Pick what you want; none are blockers.

| # | Effort | Item | Status |
|---|--------|------|--------|
| Q1 | S | **Surface save failures** — toast bus (`lib/toast` + `ToastHost`); wired into Today/Profile/Friends/Onboarding saves | ✅ done |
| Q2 | S | **Reaction toggle-off** — tapping your active reaction now removes it | ✅ done |
| Q3 | S | **Numeric caps** — client clamps `reading_pages`≤9999 / `sleep_hours`≤24 | ✅ client done; DB CHECK in `SUPABASE-TASKS.md` §2 |
| Q4 | S | **App icons** — `apple-touch-icon.png` / `pwa-*.png` missing → one console 404 | step 09/10 |
| Q5 | M | **Realtime reactions** — Replication toggle | see `SUPABASE-TASKS.md` §3 |
| Q6 | M | **Pixel-art sprites** — emoji placeholders, swap points marked in `Today.jsx` | deferred (decisions.md) |
| Q7 | S | **Loading polish** — bare `Loading...` on a few screens | backlog |
| Q8 | M | **Custom email domain** — links send from your Gmail | backlog |

---

## Residual risk (accepted for v1)

- **Magic-link is open auth** even with the allowlist — anyone can *request* a link
  to *their own* email, but the allowlist stops them at profile creation and reads.
  The deployed `.pages.dev` URL is also unguessable. Adequate for a 4-person app.
- **`confirm email = OFF`** — a typo'd email could request a link it never receives.
  Low impact; you trust the 4 addresses.
