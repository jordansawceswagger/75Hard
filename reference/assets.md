# Pixel Art Asset Sourcing

The town map needs sprites. You have three paths, ordered fastest → most polished. Pick based on whether you want to ship today or in a week.

---

## Path 1: Ship today with emoji placeholders (recommended for v1)

This is what the build/04-town-map.md code uses out of the box. Each "sprite" is just a big emoji on a white-background tile with a chunky border. Looks intentionally retro, ships in zero asset time.

**Pros:** Zero work. Universal. Ships in minutes.
**Cons:** Less personality. Looks like a placeholder because it is one.

When to keep this:
- v1 launch where you want the mechanic working before the polish
- You hate doing asset work

Emoji-per-building (already in the code):
- Library 📚 · Photo Studio 📸 · Well ⛲ · Park 🌳
- Gym 🏋️ · Kitchen 🍳 · Inn 🛏️ · Tavern 🍺
- Character 🧍

Swap to real sprites later by replacing the `<div>` containing the emoji with `<img src={`/town/${b.id}.png`} />`. No structural changes.

---

## Path 2: Free CC0 sprite packs (recommended for week-2 polish)

Real pixel art from licensed-free creators. ~1 hour of asset-hunting + cropping.

### Best sources (all free, CC0 or close):

**Kenney.nl** — the king of free game assets. Browse https://kenney.nl/assets, filter by "Tiny Town" / "Roguelike Pack" / "Pixel Platformer." Everything is CC0 (use however you want, no credit needed). The "Tiny Town" pack has buildings + character that work straight out of the box.

**OpenGameArt.org** — community uploads. Use the "CC0" license filter or things will get murky fast. Search "pixel town," "tile RPG," "16x16 buildings."

**itch.io free pixel art** — https://itch.io/game-assets/free/tag-pixel-art. Read each pack's license carefully (some are "free for personal use" only). Recommended creators:
- **Pixel Frog** (https://pixelfrog-assets.itch.io/) — clean, consistent style
- **Cup Nooble** (https://cupnooble.itch.io/) — soft pastel pixel art, matches the kawaii vibe
- **Kenmi** — building packs

### What to look for:
- **Size:** 32x32 or 16x16 sprites work best. Scale 16x16 → 32x32 with nearest-neighbor for chunkier look.
- **Style consistency:** ALL your sprites should be from the same artist or pack. Mixing styles (one pixel artist's library + another's gym) looks amateur fast.
- **Transparent background:** PNG with alpha so they sit on the grass color cleanly.
- **License:** CC0 ideal, otherwise carefully attribute.

### Recommended starter pack:
**Kenney "Tiny Town"** — https://kenney.nl/assets/tiny-town
- Includes: buildings, character, trees, water, paths, fences
- Style: charming chunky pixel, vaguely "Stardew"
- License: CC0
- Format: PNG sprite sheet (you'll need to crop individual sprites — easy in any image editor)

### Quick processing workflow:
1. Download pack → unzip → identify the building tiles you want
2. Open each in Pixelmator/GIMP/Aseprite/Photopea (browser, free)
3. Crop to 32x32 or 64x64
4. Save as PNG with transparent background
5. Drop into `public/town/` with the names in build/04-town-map.md

---

## Path 3: AI-generated pixel art (recommended if you want custom + don't have time to hunt)

Generate sprites in 5 minutes with an AI image gen, then post-process them through a pixelator. Quality is hit-or-miss — pixel art is genuinely hard for diffusion models — but it works if you're picky with prompts.

### Tools:
- **Midjourney** ($10/mo) or **DALL-E 3** (free with ChatGPT)
- **Pixelator:** https://www.pixelied.com/photo-editor/pixel-art (free, browser) or https://pixelartmaker.com

### Prompt template that works:
```
A small 16-bit pixel art building of a [LIBRARY], top-down view,
chunky pixels, pastel palette, dark outline,
transparent background, single sprite isolated, centered,
no shadow, simple cute style like Stardew Valley or Pokemon Gold
```

Generate 4-8 variations, pick the one that's most readable at small size.

### Post-processing:
1. Crop to square
2. Upload to https://www.pixelied.com/photo-editor/pixel-art
3. Apply "pixelate" filter with ~20-32 block size
4. Reduce color palette to 8-16 colors
5. Download PNG, drop into `public/town/`

### Character sprites are harder
AI struggles with consistent character sprites across multiple angles. For a single-frame character (no walking animation), it works. For 4-directional walking sprites, hand-pixel or use a pack.

---

## Path 4: Hand-pixel everything (only if you enjoy it)

If you actually like pixel art, this is the most satisfying path. You get total control and a fully custom look.

### Tools:
- **Piskel** — https://www.piskelapp.com/ (free, browser, very beginner-friendly)
- **Aseprite** — $20 desktop, the industry standard, animation support
- **Lospec Pixel Editor** — free browser tool with great palette tools

### Workflow:
1. Open Piskel, set canvas to 32x32 (or 64x64 if you want more detail)
2. Pick palette: open `reference/decisions.md` palette section → use those 6 colors
3. Sketch the building outline in dark `--ink` color
4. Fill in
5. Export as PNG

### Time investment:
- One building: 15-30 min for a beginner, 5 min once you're warmed up
- 8 buildings + 1 character: 2-4 hours total

### Palette discipline
USE ONLY the 6 palette colors from `decisions.md`. Adding extra colors breaks visual consistency across the app. The constraint will make the art better, not worse.

---

## What you actually need to ship

| Sprite          | Filename                | Size  | Used in            |
|-----------------|-------------------------|-------|---------------------|
| Town background | `public/town/map-bg.png` | 480x480 | Town map background |
| Library         | `public/town/library.png` | 64x64 | Town map           |
| Photo Studio    | `public/town/photo-studio.png` | 64x64 | Town map     |
| Well            | `public/town/well.png` | 64x64 | Town map           |
| Park            | `public/town/park.png` | 64x64 | Town map           |
| Gym             | `public/town/gym.png` | 64x64 | Town map           |
| Kitchen         | `public/town/kitchen.png` | 64x64 | Town map         |
| Inn             | `public/town/inn.png` | 64x64 | Town map           |
| Tavern          | `public/town/tavern.png` | 64x64 | Town map          |
| Character       | `public/town/character.png` | 32x32 | Town map       |

**Optional polish later:**
- Character with 4 directional sprites (down/up/left/right)
- 2-frame walking animation per direction
- Animated water/wind in background
- Day/night cycle background (cream daytime / lavender night based on hour)
- Building "lit" state — separate sprite for completed (lights in windows, etc.)

---

## Recommended for YOUR build

Given the constraints (4 friends, ship in a weekend, $0):

**Week 1:** Ship with emoji placeholders (Path 1). Get the mechanic right. Friends test it.

**Week 2:** Swap to Kenney Tiny Town pack (Path 2). 1 hour of cropping. App looks like a real game.

**Later (optional):** Custom hand-pixelled art (Path 4) for the buildings if you want unique personality. The kitchen could be your friend's favorite cafe. The inn could look like their actual bedroom. Etc.

Don't skip Path 1 to do Path 2 first. Mechanic first, art second. You can swap art without touching React code.

---

## License sanity check before you ship

- **CC0:** Use freely, no credit required. (Kenney, OpenGameArt CC0-filtered.)
- **CC-BY:** Free to use, credit required. Add a credits line in the Profile screen footer.
- **"Free for personal use":** OK for a private 4-friend app, NOT ok if you ever make it public/paid.
- **No license stated:** Don't use it. Email the creator first.

For a 4-person private friend app, the worst-case is asset creators are unlikely to ever notice or care. But CC0 is cleanest — go that route by default.
