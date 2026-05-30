# Prompt Recipes

Reusable prompt templates for working with an AI on this project. Each one assumes you've already pasted `system-prompt.md` at the start of the session.

---

## Recipe 1: Build a specific screen

```
Build the [SCREEN NAME] screen.

Spec: paste the entire contents of build/04-today-screen.md (or whichever).

Constraint: implement EXACTLY what's in the spec. Don't add features.
When you finish, list what I need to manually test on iPhone Safari.
```

---

## Recipe 2: Debug a broken thing

```
Bug: [describe what's happening]
Expected: [what should happen]
Reproduce: [exact steps]
Browser: iPhone Safari, iOS [version], PWA installed / Safari tab

Relevant files: [paste contents of the 1-2 files most likely involved]

Walk through the actual cause before proposing a fix.
Don't speculate — if you need to see another file, ask.
```

---

## Recipe 3: Add a small feature (after v1 ships)

```
Feature: [one sentence]

Before you start: check reference/decisions.md to see if this was rejected.
If it was, push back and ask why I'm reconsidering.
If it wasn't, propose the minimal implementation — 1 file changed if possible,
2-3 max. No new dependencies unless absolutely required.

I'll approve before you write code.
```

---

## Recipe 4: Code review on your own changes

```
Review the diff below before I commit. Look for:
- Pixel-aesthetic violations (rounded corners, smooth gradients, sans-serif fonts)
- iOS Safari gotchas (audio autoplay, touch events, safe-area-inset)
- Race conditions in Supabase calls
- Anything that uses a dependency not in the locked stack
- Dead code or commented-out blocks

Diff:
[paste git diff]

If everything's clean, say "ship it."
```

---

## Recipe 5: Generate the next batch of jsfxr sounds

```
I need a [DESCRIPTION] sound effect (e.g. "level up", "menu open").

Go to sfxr.me, pick the closest preset, suggest 2-3 parameter tweaks that would
make it match the description. Or pick the best preset name from this list:
pickupCoin, laserShoot, explosion, powerUp, hitHurt, jump, blipSelect, synth, tone, click.

Tell me which one and the export filename to use.
```

---

## Recipe 6: Write microcopy

```
Need microcopy for [where it appears].
Constraint: 8-bit / game style. ALL CAPS for buttons & headers.
Reject anything that sounds SaaS-y or corporate.
Give me 3 options, ranked by how well they fit a kawaii-pixel friend app.
```

---

## Recipe 7: Pre-deploy sanity check

```
I'm about to push to main and it'll auto-deploy to Cloudflare.
Walk through this checklist before I push:

- All env vars in .env.local also set in Cloudflare? [yes/no]
- Supabase Redirect URLs include the prod domain? [yes/no]
- Service worker manifest has correct icon paths? [yes/no]
- I've tested the build locally with `npm run preview`? [yes/no]
- All 4 screens work signed-in on my phone? [yes/no]

If any 'no', tell me what to do. If all 'yes', tell me to ship.
```

---

## Recipe 8: Onboarding a new friend (after launch)

```
A new friend wants to join the group on day [N] instead of day 1.

Should they:
(a) Start fresh at day 1 (their grid is independent)
(b) Pretend they started [N] days ago (will show as failed days in their grid)
(c) Something else

Walk me through the tradeoffs in 3 sentences.
```

---

## Recipe 9: "I want to add a leaderboard"

```
I want to add a leaderboard.

Read reference/decisions.md and tell me why I rejected this last time.
Then steelman the case FOR adding it.
Then tell me what I'm probably reacting to that would be better solved by
a different feature.
```

---

## Recipe 10: Reset everything (nuclear option)

```
I want to reset the database for a fresh start. Specifically:
- Keep my user account
- Delete all daily_logs and reactions
- Reset everyone's start_date to [DATE]

Write the SQL. Make me confirm before showing me the exact statements.
```

---

## Pattern: how to brief any AI on this project from cold start

If you're starting fresh in a new session (no context loaded), the minimum brief is:

```
Project: 75 HARD — pixel-art PWA for me and 3 friends to track 75 Hard.
Stack: React + Vite + JS + NES.css + Supabase + Cloudflare Pages.
Docs are in /docs and /reference relative to project root.

Read these files before answering: 
1. SPEC.md (vision)
2. prompts/system-prompt.md (working agreement)
3. reference/decisions.md (locked choices)

Then: [your actual question]
```

---

## Anti-patterns (don't do this)

- "Make it production-ready" → too vague, will produce overengineered slop
- "What do you think?" → AI will spew opinions; ask specific questions
- "Add tests" → for 4 users, not worth it; test by using the app
- "Refactor for clarity" → if it works, leave it
- "What's the best practice for X" → there are no best practices for a 4-user app
