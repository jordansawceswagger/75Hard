# Verification & Pending Checks

Things that are **built and passing build/lint** but **not yet confirmed by Jordan in the running app**, plus optional/deferred items skipped along the way. Code being done ≠ verified — this is the gap list.

Steps 00–04 are fully verified in-app. Tracking starts at 05.

---

## 05 — Friends Screen (PARTY)

**Status:** code complete, build + lint green. Awaiting in-app confirmation.

### Not yet confirmed
- [ ] `/party` renders the avatar grid with the TODAY/PARTY bottom nav
- [ ] Dicebear avatar loads as a pixel-art SVG (needs network; 404s if Dicebear is down)
- [ ] Reaction 🔥/💗 inserts + persists on reload (requires the fake-friend SQL below)
- [ ] Own card's reaction buttons are disabled (can't react to yourself)
- [ ] AFK state: a user with no log today shows grayscale + "??? AFK"

### Optional / skipped
- [ ] **Realtime replication** — Supabase → Database → Replication → toggle `reactions` ON. Skipped; not required because a `loadAll()` fallback refreshes after each reaction. Only needed to push reactions live to a *second* device in real time.
- [ ] **Multi-user test setup** — needs a non-AFK second user. SQL to add one:
  ```sql
  insert into public.users (id, email, display_name, avatar_seed, start_date)
  values ('00000000-0000-0000-0000-000000000001', 'fake@test.com', 'Test Friend', 'pixel-friend-1', current_date)
  on conflict (id) do nothing;
  insert into public.daily_logs
    (user_id, day_number, log_date, workout_1, workout_2_outdoor, diet, reading_pages, water_count, photo_taken, no_alcohol, sleep_hours)
  values
    ('00000000-0000-0000-0000-000000000001', 1, current_date, true, true, true, 12, 3, true, true, 8)
  on conflict (user_id, log_date) do nothing;
  ```
- [ ] **Cleanup** — remove the fake friend when done: `delete from public.users where email = 'fake@test.com';` (its log cascades).

---

## 06 — History Screen (QUEST LOG)

**Status:** code complete, build + lint green. Awaiting in-app confirmation.

### Not yet confirmed
- [ ] `/quest` renders 75 cells in a 5×15 grid with the QUEST nav tab
- [ ] Day 1 (today) shows lavender; days 2–75 show cream (future)
- [ ] If today's log is fully complete, day 1 shows mint instead
- [ ] Tapping a cell opens the day modal; lists missed tasks or "ALL 8 COMPLETE ✓"
- [ ] Modal closes on backdrop tap or CLOSE

### Can't be seen yet (no past days)
- [ ] **Coral "FAILED" cells** — you started today, so today = day 1 and there are *no* past days to fail. To preview the full grid, optionally backdate your start so days 1–4 become past:
  ```sql
  update public.users set start_date = current_date - 4
  where email = 'jordansdevicesinfo@gmail.com';
  ```
  Then `/quest` shows day 5 = lavender (today), days 1–4 = coral (unlogged past = failed), 6–75 = cream. **Revert when done** so your real run starts today:
  ```sql
  update public.users set start_date = current_date
  where email = 'jordansdevicesinfo@gmail.com';
  ```
  (Onboarding in step 07 will set the real start_date properly.)

### Note
- Photo display in the day modal was **removed** — nothing is stored (photo is a `photo_taken` boolean). The modal lists "Progress photo" under missed tasks if it wasn't checked.

---

## 06b + 07 — Character Builder + Onboarding

**Status:** code complete, build + lint green. Awaiting in-app confirmation.

### Not yet confirmed
- [ ] Deleting the `users` row routes you to `/onboarding` (and you DON'T flash there as an existing user — the `profileLoaded` gate)
- [ ] Step 0: name + start date, NEXT disabled until a name is entered
- [ ] Step 1: CharacterBuilder — 7 tabs, 128px preview updates instantly on tap
- [ ] Color tabs (SKIN, HAIR COLOR, EYE COLOR) show actual color swatches, not labels
- [ ] SURPRISE ME randomizes all 7 traits
- [ ] Step 2: install tutorial (or "READY" if running as installed PWA)
- [ ] DONE creates the `users` row and lands on Today
- [ ] PARTY shows your customized sprite

### To test (resets data — cascades to logs + reactions)
```sql
delete from public.users where email = 'jordansdevicesinfo@gmail.com';
```

### Notes
- Profile screen's CharacterBuilder wiring is **step 08** (Profile doesn't exist yet).
- Legacy `avatar_seed` values (`'default'`, `'pixel-friend-1'`) render as the default sprite until re-picked — expected.
- **Bug fixed vs build doc:** added `profileLoaded` to auth context so existing users don't flash to `/onboarding` before their profile loads.

---

## 08 — Profile Screen (INVENTORY)

**Status:** code complete, build + lint green. Awaiting in-app confirmation.

### Not yet confirmed
- [ ] `/me` (ME tab) shows STATS: current day, days logged, days completed, start date
- [ ] SPRITE card shows the CharacterBuilder (preview + 7 tabs); editing updates preview
- [ ] Change display name → SAVE → persists on reload
- [ ] Change sprite traits → SAVE → persists on reload; shows on PARTY
- [ ] SFX toggle off → sounds stop firing across all screens; back on → sounds return
- [ ] SIGN OUT bounces to `/signin`

### Notes
- Uses CharacterBuilder (06b override), not the base doc's seed-reroll. Completes 06b's deferred Profile wiring.
- SFX toggle is in-memory (`sfx.setEnabled`); resets to profile value on hard reload — expected per gotchas.

---

## 09 — PWA Config

**Status:** code complete, build verified (manifest + sw.js + 23 precached entries generated). Awaiting on-device confirmation.

### Not yet confirmed (needs `npm run preview` or deploy — SW is OFF in `npm run dev`)
- [ ] `npm run preview` → DevTools → Application → Manifest shows the 75 HARD manifest
- [ ] Application → Service Workers shows the SW registered
- [ ] On iPhone Safari: Share → Add to Home Screen shows the pixel "75" icon
- [ ] Installed icon opens fullscreen (no URL bar), cream splash
- [ ] Airplane-mode relaunch still opens (cached shell)

### Notes
- Icons are **placeholder** pixel "75" on peach/ink (generated, RGB no-alpha so iOS accepts them). Swap for nicer art anytime — just replace the files in `public/`.
- Real install test is easiest **after deploy** (step 10) over HTTPS, or via `npm run preview --host` + your phone on the same wifi (local IP).

---

## Cross-cutting / deferred (not tied to one step)

- [ ] **Pixel-art sprites** — town buildings + character are emoji placeholders. Real sprites drop into `public/town/`; swap points already marked in `Today.jsx`. (Intentional per `reference/decisions.md` — validate mechanic first.)
- [ ] **App icons** — `apple-touch-icon.png`, `pwa-192/512`, `favicon.ico` not created (one harmless 404 in console). Step 10 polish.
- [ ] **Sound effects** — currently generated placeholder beeps in `public/sfx/`. Swap for custom sfxr.me sounds for final polish.
- [ ] **Custom SMTP** — Gmail SMTP wired for magic-link emails (replaces dev-only built-in sender). Confirmed working at sign-in.
