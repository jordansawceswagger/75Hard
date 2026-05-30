# 11 — Invite Friends

## GOAL

Get the app installed on the 3 friends' phones with as little friction as possible. Capture their feedback in the first 48 hours, ship a bug fix or two, then leave it alone.

---

## STEPS

### 1. Pre-flight checklist (do this BEFORE sending the link)

- [ ] Visit the live URL on YOUR iPhone Safari (private browsing, signed out)
- [ ] Sign in with a different email than your main account
- [ ] Walk through onboarding as if you're a brand-new user
- [ ] Add to home screen → verify it works
- [ ] Log a full day on the test account → see confetti
- [ ] Switch back to your main account, go to /party → confirm 2 users now show
- [ ] DELETE the test account row from `users` table (so the grid stays clean for friends)

If any step fails, fix before sending. You won't get a second first impression.

### 2. Optional: pre-create the 3 friend rows so the grid looks "populated"

This is a small but real psychological move — the empty 2×2 grid with just you in it feels lonely. If you pre-insert placeholder rows for the other 3, the grid feels alive from day 1. They'll overwrite their row on first sign-in (since the `users.id` is the auth user id).

Actually — DON'T pre-insert. The user row's `id` must match `auth.users.id` and you don't have those until they sign in. Better: just tell them to all sign in within an hour of each other.

### 3. The message to send

Copy-paste this (adjust the URL):

```
hey — built a 75 hard tracker for us, kicking off [DATE].
8-bit cute. takes ~10 sec/day to log.

1. open this in SAFARI on your iPhone: https://[your-app].pages.dev
2. enter your email → check inbox → click the link
3. it'll show you how to add it to your home screen — DO THIS, it makes it feel like a real app
4. log day 1 today

react to my logs so i feel seen 💗

issues? text me, i built it so i can fix it.
```

Variations:
- **Group chat first:** drop the link in the group chat, let them install together so questions get answered once
- **Same-day kickoff:** all 4 of you should start on the same date. Otherwise the Party grid is awkward (different day numbers)
- **Set a "weekly check-in":** Sunday night text — "everyone log today?" — until habit forms

### 4. First 48 hours: babysit the deploy

Bugs you WILL find from real users that you didn't catch:
- **iPhone keyboard covering the input** when typing reading pages / sleep hours → add scroll-into-view or move inputs up
- **Photo orientation wrong** (iPhone EXIF rotation) → handle EXIF in the pixelator
- **Slow Dicebear API on slow networks** → already cached via SW, but first load can hang
- **Magic link in spam** → tell them again
- **"How do I undo a check"** → tap it again, but they'll ask

Push fixes immediately via `git push`. Cloudflare redeploys in 2 min. Friends get the update on next app open.

### 5. After week 1

If everyone's still using it: you won. Don't add features. Watch the data.

Things you might want to add later (DON'T add in week 1):
- Push notifications for daily reminders (requires iOS 16.4+ and a few extra steps)
- "Cheer everyone on" button that sends a 🔥 to anyone who hasn't reacted yet
- Stats page showing group totals
- Custom diet rules per person (right now it's just a bool)

Things you should NEVER add:
- Leaderboard
- Chat
- "Streak freeze" / pause
- Public sharing
- AI coach

### 6. If someone fails (resets to day 1)

The system currently doesn't auto-detect failure — `all_complete = false` for a past day just shows red in the Quest grid. If you want strict 75 Hard rules (miss one → restart):

Option A (manual): the friend who failed manually updates their `start_date` to today.
Option B (automatic): write a Supabase function or a small Cloudflare Worker that runs at midnight, checks yesterday's logs for each user, and if `all_complete = false`, bumps `start_date` to today + sets `current_day = 1`.

Skip option B for v1. Manual reset is fine for 4 friends — and the social ritual of saying "I failed, resetting" is part of the accountability anyway.

---

## DONE WHEN

- [ ] All 3 friends have installed the PWA
- [ ] All 3 friends have logged at least day 1
- [ ] The Party grid shows all 4 of you
- [ ] At least one mutual reaction has been exchanged
- [ ] You've shipped at least one bug fix based on real usage

---

## GOTCHAS (the real ones — from week 1 of any group app)

- **One friend will use Chrome on iPhone instead of Safari.** PWA install on iOS only works via Safari. Tell them again.
- **One friend's email won't receive the magic link** — Gmail spam, work email blocking it, whatever. Have them try a different email or check spam.
- **One friend will get bored by day 12.** That's just 75 Hard. App can't fix that.
- **The group dynamic dies if one person stops logging.** The other 3 start feeling like they're cheering into the void. Build a soft "X hasn't logged in 2 days" notification (or just text them).

---

## CONGRATULATIONS

You shipped a custom app for your friends in a weekend, for $0, with no Apple Developer fee and no servers to maintain. Now go log day 1.

---

## NEXT

There is no next file. You're done.

If you want to keep iterating, the `reference/` folder has:
- `decisions.md` — locked choices (read before adding anything)
- `gotchas.md` — known issues and workarounds
- `copy.md` — microcopy bank if you want to swap labels

If something breaks: `prompts/recipes.md` has templates for debugging with AI.
