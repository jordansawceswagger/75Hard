# Microcopy Bank

Every piece of text that appears in the app, in one place. Edit here, search-and-replace in code.

Style rules:
- ALL CAPS for buttons, headers, and tab labels
- Title Case for body copy
- No "fancy" punctuation — use plain `'`, `-`, and `.`
- Short sentences
- Game-coded labels where possible
- Never use the words "seamlessly," "intuitive," "powerful," or "robust"

---

## Tab labels

- TODAY
- PARTY
- QUEST
- ME

(Alternates if labels look cramped: TODAY / FRIENDS / LOG / SET)

---

## Screen titles

- Today: `DAY [N] / 75`
- Party: `PARTY`
- Quest Log: `QUEST LOG`
- Inventory: `INVENTORY`
- Sign In: `LOGIN`
- Onboarding step 0: `NEW QUEST`
- Onboarding step 1: `YOUR SPRITE`
- Onboarding step 2: `INSTALL ON HOME SCREEN`

---

## Today screen (town map)

The Today screen is the town map. No cards on this screen — instead, 8 clickable buildings open modals.

Map subtitle (below the map): `Tap a building to log it. Tap anywhere to wander.`

### Building labels (under each sprite, 7px Press Start 2P)

- `LIBRARY`
- `PHOTO STUDIO`
- `WELL`
- `PARK`
- `GYM`
- `KITCHEN`
- `INN`
- `TAVERN`

### Building emoji placeholders (until real sprites are sourced)

- Library 📚 · Photo Studio 📸 · Well ⛲ · Park 🌳
- Gym 🏋️ · Kitchen 🍳 · Inn 🛏️ · Tavern 🍺
- Character 🧍

### Modal headers (when a building is tapped)

- Library: `📚 LIBRARY`
- Photo Studio: `📸 PHOTO STUDIO`
- Well: `⛲ WELL`
- Park: `🌳 PARK`
- Gym: `🏋️ GYM`
- Kitchen: `🍳 KITCHEN`
- Inn: `🛏️ INN`
- Tavern: `🍺 TAVERN`

### Modal body copy (per building)

- Library (reading): `How many pages did you read today?` + `Goal: 10+`
- Photo Studio: (no prompt — just shows existing photo if any + TAKE/RETAKE button)
- Well (water): `Fill a flask (3 needed):`
- Park (outdoor workout): `Did outdoor workout (45 min)?` (yes/no toggle)
- Gym (workout 1): `Did Workout 1 (45 min)?` (yes/no toggle)
- Kitchen (diet): `Stayed on diet?` (yes/no toggle)
- Inn (sleep): `How many hours did you sleep last night?` + `Goal: 8+`
- Tavern (alcohol): `The tavern is closed for the next 75 days. Did you drink?` + button `I DRANK (breaks the run)`

Modal close button (universal): `LEAVE`

---

## Task labels (with emoji)

- 🏋️ Workout 1 (45 min)
- 🌲 Workout 2 outdoor (45 min)
- 🥗 Diet adherence
- 🚫 No alcohol

---

## Buttons

- Primary CTA: `START QUEST` / `NEXT →` / `SAVE` / `DONE — START!`
- Reroll: `REROLL`
- Keep: `KEEP →`
- Skip: `SKIP`
- Camera: `TAKE PHOTO` / `RETAKE`
- Sign in: `SEND LINK` (idle) / `SENDING...` (loading)
- Sign out: `SIGN OUT`
- Modal close: `CLOSE`

---

## Status messages

- Sign-in sent: `Check your email for a link.` + `(it may take ~30 seconds)`
- Profile not yet created: `(no profile yet — needs onboarding)`
- Loading photo: `Loading photo...`
- Loading screen: `Loading...`
- All complete banner: `DAY COMPLETE!`
- Friend AFK card: `??? AFK`

---

## Onboarding copy

Step 0:
- Prompt: `What's your name, adventurer?`
- Label: `Start date:`

Step 1 (character builder):
- Card title: `BUILD YOUR SPRITE`
- Tab labels: `SKIN` / `HAIR` / `HAIR COLOR` / `EYES` / `EYE COLOR` / `MOUTH` / `EXTRA`
- Action button (random): `SURPRISE ME`
- Confirm button: `KEEP →`

Step 2 (install):
- Lead: `For the full app experience, add this to your home screen:`
- Steps:
  1. `Tap the Share button below ⤴`
  2. `Scroll down and tap "Add to Home Screen"`
  3. `Tap Add in the top right`
  4. `Open the new 75 HARD icon from your home screen`
- Caveat: `(You can also skip this and use it in Safari, but it looks better installed.)`

Step 2 (already installed):
- `You're installed and ready to start the quest.`
- `Hello, [NAME]!`

---

## Profile / Inventory copy

- Stats labels: `Current day:` / `Days logged:` / `Days completed:` / `Started:`
- Settings labels: `Display name:` / `Sound effects`
- Footer: `Signed in as [email]`

---

## Quest Log legend

- COMPLETE
- FAILED
- TODAY
- FUTURE

---

## Friend card

- Level prefix: `LV [N]` (e.g. `LV 12`)
- AFK status: `??? AFK`

---

## Modal copy (Day detail)

- Header: `DAY [N]`
- Complete state: `ALL 8 COMPLETE ✓`
- Missed lead: `Missed:`
- Task labels in missed list (these are slightly different from the Today screen — more compact):
  - Workout 1
  - Outdoor workout
  - Diet
  - 10 pages (got [N])
  - 120oz water (got [N]/3)
  - Progress photo
  - No alcohol
  - 8h sleep (got [N]h)

---

## Error states (when you need them)

Generic save fail: `Couldn't save. Try again.`
Network error: `No connection.`
Photo upload fail: `Photo didn't upload. Try once more.`
Auth error: `Couldn't sign in. Check your email and try again.`

---

## Invite message template (to send friends)

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

---

## Voice exceptions

If you ever need to soften a destructive action ("delete account", "reset progress"), drop the ALL CAPS for the confirmation:
- Button: `DELETE ACCOUNT`
- Confirmation body: `This wipes everything. You sure?` (not all caps — feels more human)

Don't get cute with error states. "Oops!" / "Uh oh!" are banned. Just say what broke and what to do.

---

## Reactions (locked)

- 🔥 (fire) — "you went hard today"
- 💗 (sparkle heart) — "love/support"

Do NOT add more reactions without checking `decisions.md`.
