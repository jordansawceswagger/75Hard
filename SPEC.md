# 75 Hard — 4-Person PWA, 8-bit Style, $0 Cost

The whole rewrite. Native app and TestFlight dropped — this ships as a Progressive Web App with NES.css styling, hosted free on Cloudflare Pages, backed by Supabase free tier. Friends add it to their iPhone home screen and it looks like an app.

---

## TL;DR — the stack, the cost, the scope

**Total cost: $0 forever** (until you decide you want a custom domain — then $12/yr optional). No Apple Developer Program, no Hetzner, no surprise bills. The stack: **Vite + React** for the app, **NES.css + custom pixel CSS** for the aesthetic, **Press Start 2P + VT323** for fonts, **jsfxr** for chiptune sound effects, **Supabase** free tier for auth/database/photo storage, **Cloudflare Pages** for hosting. Friends visit a URL on Safari, tap Share → Add to Home Screen, and now they have a pixelated 75 Hard icon on their phone that opens fullscreen.

Same 5-screen scope as before. Same rules. Same data model. Different paint job, different distribution.

> Distraction: you're sidestepping Apple's gatekeeping entirely. There's a satisfying conspiracy-tier read here — Apple has spent a decade quietly nerfing PWAs on iOS to protect the 30% App Store cut, and the workaround is "just build a website that looks like an app." The fact that this still works in 2026 is borderline miraculous. Take advantage before they break it.

---

## The rules (unchanged from v1)

Each day, every person logs 8 things:

1. Workout 1 — 45 min
2. Workout 2 — 45 min, **outdoor**
3. Diet adherence (their chosen diet)
4. 10 pages of a self-help book
5. 120 oz water (counter to 3 Hydro Flasks)
6. Progress photo
7. No alcohol
8. 8 hours of sleep

Miss one → reset to Day 1. That's the entire core mechanic.

---

## The Pokemon framing (the secret weapon)

The town map isn't just a cuter checkbox list — it's a framing shift. When the Library *is* the reading task, the friend group's language becomes "did you visit the library today?" not "did you read?" The verb changes from *check off* to *go somewhere*. That tiny linguistic shift makes daily logging feel like a place you went, not a chore you checked. Same data, different gravity.

The Tavern building is intentionally inverted — it's the only building you complete by NOT visiting. Default state is dim/faded (you're avoiding it). If you tap it and confess "I drank," the building lights up coral (failure). This makes the no-alcohol rule feel like a place you're choosing not to enter, which is psychologically heavier than a checkbox you forgot to tick.

## 8-bit aesthetic direction

**Base framework: NES.css.** Drop-in CSS from a CDN, ships pre-styled chunky buttons, dialog boxes, progress bars, sprites of Mario-era characters. ~28KB. You'd write maybe 200 lines of custom CSS on top. Zero React component coupling — it's just classes.

**Fonts: Press Start 2P for headers, VT323 for body.** Press Start 2P is the iconic blocky 8-bit font but unreadable past ~14px chunks of text — use it only for the day counter, screen titles, and button labels. VT323 is a terminal-style pixel font that stays legible at body-text sizes. Both free from Google Fonts.

**Color palette — kawaii 8-bit, not NES-garish.** Override NES.css's default loud red/blue with a pastel palette so it reads "cute" not "video game store demo." Recommended:

```
--cream    #FFF4E0   /* background */
--peach    #FFB5A7   /* primary accent */
--lavender #C8B6FF   /* secondary accent */
--mint     #B8E0D2   /* success / completed */
--coral    #FF7B7B   /* warning / failed */
--ink      #2D2D44   /* text + pixel outlines */
```

Everything chunky-outlined in `--ink` (2px solid borders, no gradients, no soft shadows). Drop shadows are square: `box-shadow: 4px 4px 0 var(--ink);` — that hard-edged offset is *the* 8-bit move.

**Photos: pixelate them on render.** Progress pics will clash with the pixel UI if you display them as smooth photos. Two-step fix: (1) downscale to 96×96 on upload using a canvas, then (2) display at 192×192 with `image-rendering: pixelated`. Result: every progress pic looks like a GBA sprite. Way cuter than it sounds. Bonus: smaller files = faster Supabase storage.

**Avatars: Dicebear "Pixel Art" style.** Free API, takes a seed string (the user's name), returns a unique pixel-art avatar SVG. `https://api.dicebear.com/7.x/pixel-art/svg?seed=jordan`. Zero asset work, every friend gets a unique sprite automatically.

**Sound: jsfxr-generated SFX.** This is the secret weapon. jsfxr is a JavaScript port of the classic sfxr 8-bit sound generator — you click a "pickupCoin" preset on sfxr.me, it generates a tiny .wav, you save it to your `/public` folder, play it on tap with `new Audio('/sfx/tap.wav').play()`. Recommended SFX set: `tap.wav` (click preset), `complete.wav` (powerUp preset), `streak_break.wav` (hitHurt preset), `day_done.wav` (synth fanfare). Total file size: ~10KB combined. Mute toggle in Profile so people on the train don't get blasted.

**Confetti: pixel confetti, hand-rolled.** Don't import a library. 30 lines of canvas — square 4×4px particles in your palette colors, falling with gravity, rotating. Plays on day completion with the `day_done.wav`. Feels custom.

> Distraction on aesthetic theory: most "cute" apps lean on softness — pillowy gradients, rounded corners, friendly sans-serif. 8-bit goes the opposite direction: hard edges, limited palette, chunky pixels, monospace font. It works *because* it's confident — there's no design indecision when every pixel is mandatory. The constraint *is* the style. (This is also why pixel art is so cheap to produce well: 90% of design decisions are made for you by the medium.)

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast dev server, zero config, the default in 2026 |
| Framework | **React** (no SSR, no Next.js) | You know JS, no need for server rendering, keep it pure SPA |
| Language | **TypeScript** | Catches the dumb bugs at 11pm; if you'd rather skip, plain JS works |
| Router | **react-router-dom v6+** | 5 screens, file-based routing overkill |
| Styling | **NES.css + handwritten CSS variables** | Don't bring in Tailwind, it'll fight the pixel aesthetic |
| Backend | **Supabase JS client (@supabase/supabase-js)** | Auth, DB, storage — one SDK |
| PWA | **vite-plugin-pwa** | Generates manifest + service worker, zero-config preset |
| Sound | **Plain `<audio>` or `new Audio()`** | jsfxr only needed once to *generate* the wavs, then static files |
| Avatars | **Dicebear API (pixel-art style)** | Zero asset work, deterministic from seed |
| Hosting | **Cloudflare Pages** | Free, unlimited bandwidth, auto-deploys from GitHub push |
| Source control | **GitHub (free)** | Triggers Cloudflare builds |

That's the whole list. No EAS, no Xcode, no native modules, no provisioning profiles, no certs.

---

## Data model

Unchanged from v1 — Postgres is Postgres whether it's serving a native app or a PWA. Three tables in Supabase:

```sql
-- users
id (uuid, pk, references auth.users)
email (text)
display_name (text)
avatar_seed (text)        -- string fed to Dicebear, e.g. "jordan-2026"
start_date (date)
current_day (int)         -- denormalized for fast reads
status (text)             -- 'active' | 'failed' | 'completed'
sfx_enabled (bool, default true)
reminder_time (time, nullable)
created_at (timestamptz)

-- daily_logs
id (uuid, pk)
user_id (uuid, fk → users)
day_number (int)          -- 1..75
log_date (date)
workout_1 (bool)
workout_2_outdoor (bool)
diet (bool)
reading_pages (int)
water_count (int)         -- 0..3
photo_url (text)
no_alcohol (bool, default true)
sleep_hours (numeric)
all_complete (bool generated always as (
    workout_1 AND workout_2_outdoor AND diet
    AND reading_pages >= 10 AND water_count >= 3
    AND photo_url IS NOT NULL AND no_alcohol
    AND sleep_hours >= 8
) stored)
created_at (timestamptz)

-- reactions
id (uuid, pk)
log_id (uuid, fk → daily_logs)
from_user_id (uuid, fk → users)
emoji (text)              -- check constraint: in ('🔥', '💗')
created_at (timestamptz)
unique (log_id, from_user_id)  -- one reaction per person per log
```

Enable RLS on all three. Policy: users can read all rows in `users` and `daily_logs` (friend visibility), can only insert/update their own. Reactions: anyone can insert their own reactions, only the owner can delete.

---

## The 5 screens (8-bit redress)

**1. Onboarding.** Single dialog box (NES.css `nes-container with-title is-dark`) titled "NEW GAME." Three fields: name, start date, daily reminder time. Big chunky "START QUEST" button. On submit, generates a Dicebear avatar from their name and a coin-pickup SFX plays.

**2. Today (Town Map).** The whole identity of the app lives here. A tiny top-down pixel-art town fills the screen. 8 buildings positioned around a grass field, each mapped to one of the daily tasks: Library (reading), Gym (workout 1), Park (outdoor workout), Well (water), Kitchen (diet), Inn (sleep), Photo Studio (progress pic), and Tavern (the "no alcohol" rule — an *avoidance* building). The user's character sprite stands in the middle. Tap a building → character walks there (300ms CSS transition with steps() easing for that jerky 8-bit feel) → modal opens with that task's input → submit → building visually lights up (mint background) to show "complete." Tap empty grass → character wanders there, no other effect. This Pokemon-style framing turns every checkbox into a *visit*, which changes how friends talk about the day. When all 8 are complete: confetti + `day_done.wav` + "DAY COMPLETE!" banner overlaid on the map.

**3. Friends (or "PARTY" if you want to commit to the bit).** 2×2 grid of "character cards" — each one a NES.css dialog with the friend's Dicebear avatar, name in Press Start 2P, current day as "LV 12," and today's completion as a pixel progress bar. Two reaction buttons at the bottom of each card (🔥 and 💗), each tap inserts to the reactions table + plays a quick SFX. If a friend hasn't logged today, their card is grayscale-CSS-filtered with "??? AFK" text.

**4. History (or "QUEST LOG").** A 5×15 grid of 75 pixel squares. Mint = complete, coral = failed, cream = future. Tap one → modal pops up with that day's photo + which tasks were missed if any. This is the dopamine loop visualization.

**5. Profile (or "INVENTORY").** Edit name, regenerate avatar (changes the Dicebear seed), change reminder time, toggle SFX, see lifetime stats (longest streak, total restarts, etc.), log out. Boring on purpose.

---

## PWA + iOS gotchas (read this twice)

**The manifest** lives at `/public/manifest.webmanifest`, generated by vite-plugin-pwa. Needs:
- `name`: "75 HARD"
- `short_name`: "75 HARD"
- `start_url`: "/"
- `display`: "standalone" (this is what hides the Safari URL bar)
- `theme_color`: `#FFB5A7` (your peach)
- `background_color`: `#FFF4E0` (your cream — splash screen background on iOS)
- `icons`: 192×192 and 512×512 PNGs in `/public/`

**Apple needs special treatment.** Add to `index.html`:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png"> <!-- 180×180 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="75 HARD">
```
Without these, the home-screen icon will be wrong and the app won't open fullscreen.

**The icon should be pixel-art too.** Make it 8-bit obvious so the home screen looks like a Game Boy cartridge. AI image gen → downscale to 180×180 with `image-rendering: pixelated`-equivalent processing. Or hand-pixel it in Aseprite/Pixilart in 10 minutes.

**Push notifications on iOS PWA** require: (1) iOS 16.4+, (2) app must be added to home screen first, (3) user must grant permission inside the installed PWA, not from Safari. Skip push for v1 — use **local scheduled reminders via the Notifications API** wrapped in a service worker. Honestly easier to just send them an iMessage at 8pm if all you want is the nudge.

**Onboarding has to teach Add to Home Screen.** iOS hides this in the Share sheet. Build a one-screen tutorial that shows up on first visit if `!window.navigator.standalone`:

> "Tap [share icon] then 'Add to Home Screen' to install."

Animate a pixel arrow pointing to the bottom of the screen. Without this step, friends will use the app in Safari with the URL bar visible and it'll feel broken.

**iOS storage eviction:** Safari may clear PWA storage if the app sits unused 7+ weeks. Irrelevant for daily use, but if someone breaks their streak and walks away, when they come back they're logged out. Magic-link reauth = 10 seconds, fine.

---

## Asset note

The town map needs sprites — 8 buildings + 1 character. You can ship v1 with emoji placeholders (each "building" is a chunky border around an emoji), then swap to real sprites in week 2 once the mechanic is validated. See `reference/assets.md` for sourcing options: Kenney CC0 packs (recommended), itch.io free assets, AI-generated, or hand-pixelled. Don't block on art — ship the loop first.

## Build order (one weekend, looser this time)

**Saturday morning:**
- `npm create vite@latest 75-hard -- --template react-ts`
- Install: `@supabase/supabase-js`, `react-router-dom`, `vite-plugin-pwa`
- Add NES.css via CDN link in `index.html` + Google Fonts links for Press Start 2P and VT323
- Define CSS variable palette in `index.css`
- Create Supabase project (free tier), run the 3 table migrations, set RLS policies
- Wire magic-link auth, verify you can sign in on your phone via the Vite dev server (use `--host` flag)

**Saturday afternoon:**
- Build the Today screen — all 8 checkboxes wired to upsert into `daily_logs`
- Photo capture: `<input type="file" accept="image/*" capture="environment">` → canvas downscale to 96×96 → upload to Supabase storage → save URL
- Generate the 4 SFX on sfxr.me, drop in `/public/sfx/`
- Confirm taps make pixel-y sounds

**Saturday evening:**
- Friends grid + reactions
- Dicebear avatars wired up
- Pixel confetti on all-complete
- Pixel progress bars for the friend cards

**Sunday morning:**
- History grid (75 cells, tap to expand modal)
- Onboarding flow with Add-to-Home-Screen tutorial
- Profile screen

**Sunday afternoon:**
- vite-plugin-pwa setup, generate icons, test "Add to Home Screen" on your iPhone
- Service worker for offline (NES.css + fonts cached, dynamic data still hits Supabase)
- Push to GitHub, connect Cloudflare Pages, deploy
- Verify the deployed URL works as a standalone app on iPhone

**Sunday night:**
- Text the URL to the 3 friends with install instructions ("open in Safari → Share → Add to Home Screen")
- Watch them install, fix the inevitable bug that only appears on someone else's phone

Total real time: probably 12-16 hours if you don't bikeshed. 24-30 if you do.

---

## What NOT to build (still applies)

- No leaderboard. (You will want this. Don't.)
- No chat. iMessage exists.
- No streak protection. Defeats the point.
- No Android-specific code. PWA works the same on both, you don't have to think about it.
- No AI features. Resist the urge to add a "smart coach."
- No subscriptions. It's 4 friends.
- No animations beyond Moti-level basics. Pixel art is mostly static — that's part of the charm. A jittery sprite or two is fine; full Reanimated-style choreography breaks the vibe.

---

## Real costs

| Item | Cost |
|---|---|
| Cloudflare Pages (hosting + bandwidth) | $0 |
| Supabase free tier (auth + DB + 1GB storage) | $0 |
| GitHub (private repo) | $0 |
| Vercel/Netlify equivalent if you ditch Cloudflare | $0 |
| Google Fonts + NES.css + jsfxr + Dicebear | $0 |
| Optional custom domain (e.g. 75hard.app) | ~$12/yr |
| **Total to ship and run** | **$0** |

You can spend $12 on a domain just for the cute factor of "https://75hard.party" or whatever, but `your-app.pages.dev` is fine.

---

## Open questions before you build

1. **TypeScript or plain JS?** TS catches more bugs but adds friction. You know JS already — recommend JS for v1, refactor later if it grows.
2. **Same start date for all 4, or staggered?** Same date makes the social layer (seeing everyone on the same day number) much more satisfying. Recommend same.
3. **Confirm the 2 emoji reactions.** I'm guessing 🔥 and 💗 — ask them.
4. **Want me to actually start building this?** I can scaffold the Vite project, set up the Supabase schema as a migration file, and stub out the 5 screens. Then you fill in the logic. Say the word.

---

## References

- [NES.css framework](https://nostalgic-css.github.io/NES.css/) · [NES.css GitHub](https://github.com/nostalgic-css/NES.css)
- [RPGUI (alternative pixel framework)](https://github.com/RonenNess/RPGUI)
- [jsfxr — 8-bit SFX generator](https://sfxr.me/) · [jsfxr npm](https://www.npmjs.com/package/jsfxr)
- [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/guide/)
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa)
- [Cloudflare Pages — deploy Vite](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
- [Supabase docs](https://supabase.com/docs)
- [Dicebear pixel-art avatars](https://www.dicebear.com/styles/pixel-art/)
- [iOS PWA push notifications (Safari 16.4+)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Press Start 2P font](https://fonts.google.com/specimen/Press+Start+2P) · [VT323 font](https://fonts.google.com/specimen/VT323)
