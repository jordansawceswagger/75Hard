# Locked Decisions

The choices that have been considered and locked. **Read this before adding anything to the app.** If you find yourself relitigating one of these, you're probably scope-creeping.

Each row has the choice, the reasoning, and the conditions under which it should be re-opened.

---

## Stack decisions

### React + Vite (not Next.js, not Remix, not vanilla)
- **Why:** Vite is faster to start, no server needed, pure SPA is enough for 4 users
- **Re-open if:** you want SEO (you don't — it's a private app) or server-rendered initial loads

### JavaScript (not TypeScript)
- **Why:** v1 speed, you know JS, types are overkill for 4 users
- **Re-open if:** the codebase grows past ~30 components or you onboard another dev

### NES.css (not Tamagui, not NativeWind, not Tailwind)
- **Why:** Pre-styled chunky pixel components, zero learning curve, fits the aesthetic free
- **Re-open if:** you want to scale this to multiple themes (you don't)

### Supabase (not Firebase, not Convex, not self-hosted)
- **Why:** Free tier covers 4 users for years, Postgres is the right data shape, RLS is built-in
- **Re-open if:** you hit 50k MAU (you won't) or need offline-first sync (you don't)

### Cloudflare Pages (not Vercel, not Netlify, not Hetzner)
- **Why:** Free, unlimited bandwidth, fastest cold-start, no surprise bills
- **Re-open if:** Cloudflare's edge network has an outage during a critical demo (it won't)

### PWA (not React Native, not Capacitor, not native iOS)
- **Why:** $0 distribution, no Apple Developer fee, instant updates, no app store review
- **Re-open if:** you need camera APIs Safari doesn't expose, or true background sync

---

## Scope decisions (the "no" list)

### NO leaderboard
- **Why:** Competition kills the cooperative dynamic. The moment one friend is "winning," the other three quietly disengage.
- **Re-open if:** the friend group explicitly asks for it AND you've all completed at least one 75 cycle without it

### NO chat
- **Why:** iMessage/WhatsApp exists. Building chat = building a worse version of those apps.
- **Re-open if:** never. Use iMessage.

### NO streak protection / "freeze days" / pause
- **Why:** Defeats the entire purpose of 75 Hard. The whole product is the unforgiveness.
- **Re-open if:** you're building a different app

### NO push notifications in v1
- **Why:** iOS PWA push requires 16.4+ and an extra setup ceremony. Local reminders or a group chat ping work for v1.
- **Re-open if:** v1 has been running for 30 days and adherence is dropping

### NO Android-specific code
- **Why:** PWA is cross-platform by default. Friends are on iPhone.
- **Re-open if:** a friend switches to Android and the app actually breaks (it shouldn't)

### NO TypeScript migration (in v1)
- See above. Re-open at scale.

### NO custom diet rules per person
- **Why:** Each person tracks their own adherence as a single bool. They define their own diet.
- **Re-open if:** a friend wants to share their diet plan or get reminders specific to it

### NO multi-group support
- **Why:** This app is for 4 specific people. Adding "create a group" multiplies the data model and the auth complexity.
- **Re-open if:** other friend groups ask to use it (then fork the codebase, don't multi-tenant)

### NO AI / "smart coach" / GPT integration
- **Why:** It's a habit tracker, not a coaching app. AI features here would be lipstick on the wrong pig.
- **Re-open if:** never

### NO subscriptions / paywalls / Stripe
- **Why:** 4 friends, $0 forever. Money flows in the wrong direction here.
- **Re-open if:** the app organically grows past 50 active users

### NO public sharing / Instagram exports
- **Why:** Progress photos are private. Adding share = adding privacy decisions you don't want to make.
- **Re-open if:** never

### NO Apple Health / Google Fit integration
- **Why:** The 8 daily checks are self-reported by design. Auto-syncing workout data defeats the accountability of saying "I did it."
- **Re-open if:** never

---

## Aesthetic decisions

### Pixel art, not "modern app design"
- **Why:** Constraints make design decisions easy. Pixel art is cheap to produce well.
- **Re-open if:** the friend group hates it after 1 week (they won't)

### Kawaii pastel palette, not NES-default garish
- **Why:** Pink/lavender/mint reads as "private friend app" not "video game demo"
- **Re-open if:** the palette feels too soft and not "8-bit" enough — minor tweak, don't change framework

### Only 2 emoji reactions (🔥 and 💗)
- **Why:** Constraint = signal. 47 reactions = noise.
- **Re-open if:** friends request a specific 3rd emoji; max 3 ever

### Photos pixelated on display
- **Why:** Smooth photos clash with pixel UI. Pixelating them looks intentional.
- **Re-open if:** never. This is locked.

### Pixel sprites (Dicebear) instead of uploaded avatars
- **Why:** Free, consistent aesthetic, zero asset management, every friend gets unique sprite from name seed
- **Re-open if:** a friend really wants their own avatar — add a single upload-override later

### Full character customization (not just seed reroll)
- **Why:** "Reroll a random seed" is a slot machine, not a choice. Friends will compare characters — let them actually pick. 7 traits × ~6 options each = ~280k combinations, plenty of personality.
- **Re-open if:** more than 4 of the 7 traits feel redundant; trim the list (don't add more)

### Character config stored as JSON in `users.avatar_seed` (no schema change)
- **Why:** No migration. Column is text. JSON.parse on read, JSON.stringify on write. Old seed values fall back to default config.
- **Re-open if:** you need to query characters by individual traits in SQL (you won't)

### Dicebear API version pinned to 9.x
- **Why:** Trait IDs (`short01`, `variant05`) can change between major versions. Pin to a known-good version.
- **Re-open if:** Dicebear 9.x is deprecated and the API stops responding

### Sounds on every interaction
- **Why:** It's part of the 8-bit identity. There's a Profile toggle for people who hate it.
- **Re-open if:** sounds are annoying after week 1 — but the toggle handles that

### Today screen IS a town map (not a checkbox list)
- **Why:** Turns every task from a chore into a *place*. Changes how friends talk about logging ("did you visit the library?" vs "did you read?"). Pokemon-style framing is the whole product identity.
- **Re-open if:** friends find the buildings confusing or hard to tap on small screens — could fall back to a hybrid (map for quick log + list for detail)

### Tiled town + grid pathfinding + animated walk cycle (OVERRIDE, 2026-05-29)
- **What changed:** The Today screen is now a real 10×10 tiled map (grass/dirt-path sprites). Tapping a task runs **A\* pathfinding** (path tiles cheaper, so the character walks the roads) and the character **walks the route tile-by-tile around buildings** with a directional **2-frame walk cycle** sprite — no more emoji sliding diagonally.
- **Why:** Jordan wanted the Pokémon-style scape with generated paths, not emojis moving. This was the explicit re-open condition on the three decisions below.
- **Art:** generated locally (`scripts/gen_town_assets.py` → `public/town/*.png`): grass/path tiles, a 4-dir × 2-frame character sheet, 8 building sprites. Basic but real pixels; **swappable** — drop nicer PNGs into `public/town/` with no code change.
- **Supersedes:** the three decisions immediately below (struck). `Map is 480×480 fixed` still holds (grid renders responsively inside it).
- **Re-open if:** you want collision detail beyond buildings, animated buildings, or real (Kenney/Aseprite) art.

### ~~Character is one frame, no walking animation (in v1)~~ (superseded by the override above)
- **Why:** 4-directional animated sprites are 4-8x the asset work. Single frame + CSS transition is 90% of the feel for 10% of the work.
- **Re-open if:** v1 ships and you want polish; adding 4-frame walk cycles is a week 3 win

### Tavern is the inverted "avoidance" building
- **Why:** Makes the no-alcohol rule physical/spatial instead of a passive checkbox. Heavier psychologically.
- **Re-open if:** never. This is the cleverest part of the design.

### Map is 480x480, fixed (no scrolling, no zoom)
- **Why:** Fits one phone screen. No camera-following logic. Eight buildings + walkable area is plenty of space.
- **Re-open if:** you add more than 10 buildings (you shouldn't)

### ~~Building click-to-walk uses CSS transition, not pathing/collision~~ (superseded — now A* grid pathfinding)
- **Why:** Pathfinding is overkill for a town with no obstacles. CSS `transition` with `steps(8)` easing gets the Pokemon jerky-walk feel.
- **Re-open if:** you add obstacles or walls (you won't)

### ~~Asset workflow: emoji placeholders → Kenney pack later~~ (partially superseded — generated sprites now; Kenney still an option)
- **Why:** Ship the mechanic first, swap art second. Asset hunting blocks the build otherwise.
- **Re-open if:** never. Always validate the mechanic before pouring time into art.

---

## Technical decisions

### Day numbering anchored to `start_date`
- **Why:** Simple math, no edge cases around timezone, each person owns their own quest
- **Re-open if:** friends want to start together and stay in sync (just use the same start_date)

### Progress photo is a self-reported checkbox, NOT an upload (OVERRIDE, 2026-05-29)
- **Why:** Friends already share daily pics in iMessage/group chat. Re-uploading them into the app is redundant ceremony. The accountability is the same as the other 7 checks — you tap "I took/sent today's photo." This kills the entire storage stack: no `progress-photos` bucket, no storage RLS policies, no signed URLs, no client-side downscale, no `image/*` MIME handling.
- **Schema impact:** `daily_logs.photo_url text` → `photo_taken boolean not null default false`; `all_complete` checks `photo_taken` instead of `photo_url is not null`.
- **Supersedes:** the two photo-storage decisions below (struck) and the "Photos downscaled to 96×96" note. The "Photos pixelated on display" aesthetic decision is now moot (no photos displayed). The "NO public sharing" decision is unaffected.
- **Re-open if:** friends actually want past photos visible inside the app as a gallery — then reintroduce the bucket + upload flow as documented below.

### ~~Photo storage: private bucket with signed URLs~~ (superseded — see override above)
- **Why:** Privacy by default. Signed URLs auto-expire.
- **Re-open if:** signed URL generation becomes a perf bottleneck (it won't for 4 users)

### ~~Photos downscaled to 96×96 on upload~~ (superseded — no upload anymore)
- **Why:** Small file size + intentional pixelation. Saves storage.
- **Re-open if:** someone wants to see a "real" version of a past photo — but that breaks the aesthetic

### Magic-link auth (not password, not OAuth)
- **Why:** No passwords to manage, no Google/Apple OAuth setup, works on any email
- **Re-open if:** the magic link emails get spam-filtered too often (then add Google OAuth)

### Realtime subscriptions only on reactions
- **Why:** Daily logs change slowly (~once per day per user); polling on Friends-screen load is enough. Reactions are interactive and benefit from instant updates.
- **Re-open if:** you add a feature that needs realtime log updates (you shouldn't)

### One unique reaction per (user, log)
- **Why:** Tap 🔥 then 💗 swaps it. Forces friends to choose, makes each reaction mean more.
- **Re-open if:** friends want to express multiple feelings on one log — easy: drop the unique constraint

---

## How to use this file

**Before adding any feature**, search this file for related terms. If you find a "NO" row, read the why and the re-open condition. If the re-open condition isn't met, don't build it.

**If you decide to override a decision**, edit this file FIRST. Add a new row with the new choice + the reasoning that overrode the old one. Then build it. This prevents your future self from re-relitigating.

**If you find yourself disagreeing with multiple decisions at once**, you're probably trying to build a different product. Step back and re-read SPEC.md.
