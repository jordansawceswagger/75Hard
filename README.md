# 75 HARD — Build Folder

Everything you need to ship a $0 PWA 75 Hard tracker for 4 friends. Pixel-art aesthetic, no Apple Developer account, no servers to babysit.

---

## What's in here

```
75 Hard/
├── SPEC.md                  ← The master vision doc. Read first.
├── README.md                ← You are here.
├── build/                   ← Sequential build steps. Open one, ship, move to next.
│   ├── 00-setup.md
│   ├── 01-supabase.md
│   ├── 02-design-system.md
│   ├── 03-auth.md
│   ├── 04-town-map.md         ← The Today screen, as a Pokemon-style town
│   ├── 05-friends-screen.md
│   ├── 06-history-screen.md
│   ├── 06b-character-builder.md ← Shared CharacterBuilder for onboarding + profile
│   ├── 07-onboarding.md
│   ├── 08-profile-screen.md
│   ├── 09-pwa-config.md
│   ├── 10-deploy.md
│   └── 11-invite-friends.md
├── prompts/                 ← Meta. How to brief an AI on this project.
│   ├── system-prompt.md
│   └── recipes.md
└── reference/               ← Sideways material you'll grep back into.
    ├── decisions.md
    ├── gotchas.md
    ├── copy.md
    └── assets.md            ← Where to source pixel sprites for the town
```

---

## How to use this folder

**If you're building yourself:** Open `build/00-setup.md` and work straight down. Each file is a discrete unit — ship it, mark it done, move to the next. Don't skip ahead. Each step assumes prior steps are working.

**If you're using an AI coding agent** (Claude Code, Cursor, etc.): 

1. Paste `prompts/system-prompt.md` at the start of every session. This loads the project context.
2. Then paste the current `build/NN-*.md` file as the actual task.
3. Use patterns from `prompts/recipes.md` for follow-ups, debugging, and iteration.

**If you get stuck:** Check `reference/gotchas.md` first — most of the dumb problems are pre-documented there.

---

## The constraints (these are locked — see `reference/decisions.md`)

- **Stack:** Vite + React + JS + NES.css + Supabase + Cloudflare Pages
- **Cost:** $0 (optional $12/yr for a custom domain)
- **Scope:** 5 screens, 8 daily checks, 2 emoji reactions, no leaderboard, no chat
- **Aesthetic:** 8-bit / pixel art with a kawaii pastel palette
- **Distribution:** PWA — friends Add to Home Screen on iOS, no app store

---

## Build order, in plain English

1. Scaffold the Vite app, install deps
2. Set up the Supabase project, create tables, RLS policies
3. Build the design system — palette, fonts, NES.css overrides, sound effects
4. Wire up magic-link auth
5. Build the Town Map / Today screen (Pokemon-style — clickable buildings open task modals)
6. Build the Friends grid + reactions
7. Build the History (Quest Log) grid
8. Build Onboarding + the iOS install tutorial
9. Build Profile/Inventory
10. PWA config — manifest, icons, iOS meta tags, service worker
11. Deploy to Cloudflare Pages
12. Send install instructions to friends

A focused weekend gets you to step 11. Step 12 is a text message.

---

## When you finish a step

Cross it off here so you can see where you are:

- [x] 00 — Setup
- [x] 01 — Supabase
- [x] 02 — Design system
- [x] 03 — Auth
- [x] 04 — Town map
- [x] 05 — Friends screen
- [x] 06 — History screen
- [x] 06b — Character builder
- [x] 07 — Onboarding
- [x] 08 — Profile screen
- [x] 09 — PWA config
- [ ] 10 — Deploy
- [ ] 11 — Invite friends

---

## One rule

If you find yourself wanting to add something that isn't in `SPEC.md`, check `reference/decisions.md` first to see if it was already considered and rejected. If it wasn't, write it down before building it. Scope creep is the only thing between you and shipping.
