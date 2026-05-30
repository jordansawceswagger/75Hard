# Town Sprites — Drop-in Replacement

Real Kenney Tiny Dungeon sprites mapped to your 8 buildings. CC0 license — use freely, no credit needed.

## Install (literal copy-paste)

```bash
# from your React project root (NOT this 75 Hard folder — your actual code repo)
mkdir -p public/town
cp "/Users/jordan/Documents/Claude/Projects/75 Hard/town-sprites/"*.png public/town/
ls public/town/
```

You should see: `character.png`, `grass.png`, `gym.png`, `inn.png`, `kitchen.png`, `library.png`, `map-bg.png`, `park.png`, `photo-studio.png`, `tavern.png`, `well.png`.

## Code swap in `src/screens/Today.jsx`

### 1. Replace the building emoji `<div>` with `<img>`

Find this block in the BUILDINGS map:

```jsx
<div
  style={{
    width: 56, height: 56,
    fontSize: 40, lineHeight: '56px', textAlign: 'center',
    background: done ? 'var(--mint)' : '#fff',
    border: '3px solid var(--ink)',
    ...
  }}
>
  {b.emoji}
</div>
```

Replace with:

```jsx
<div
  className={done ? 'building-done' : ''}
  style={{
    width: 56, height: 56,
    background: done ? 'var(--mint)' : '#fff',
    border: '3px solid var(--ink)',
    boxShadow: done ? '0 0 0 2px var(--mint)' : '2px 2px 0 var(--ink)',
    opacity: b.task === 'alcohol' && !done ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <img
    src={`/town/${b.id === 'photo' ? 'photo-studio' : b.id}.png`}
    alt={b.label}
    className="pixelated"
    style={{ width: 48, height: 48 }}
  />
</div>
```

### 2. Replace character emoji with `<img>`

Find the character div (the one with `🧍`), replace with:

```jsx
<div
  className="character-idle"
  style={{
    position: 'absolute',
    left: charPos.x,
    top: charPos.y,
    width: 32, height: 32,
    transition: 'left 300ms steps(8), top 300ms steps(8)',
    pointerEvents: 'none',
    filter: 'drop-shadow(2px 2px 0 var(--ink))',
  }}
>
  <img
    src="/town/character.png"
    alt=""
    className="pixelated"
    style={{ width: 32, height: 32 }}
  />
</div>
```

### 3. Use the grass background for the map

Find the outer map `<div>` and swap the green color for the tiled background:

```jsx
style={{
  position: 'relative',
  width: MAP_SIZE,
  height: MAP_SIZE,
  maxWidth: '100%',
  aspectRatio: '1 / 1',
  margin: '0 auto',
  backgroundImage: 'url(/town/map-bg.png)',
  backgroundSize: 'cover',
  imageRendering: 'pixelated',
  border: '4px solid var(--ink)',
  overflow: 'hidden',
  cursor: 'pointer',
}}
```

### 4. (Optional) Match building IDs to file names

The BUILDINGS array uses `id: 'photo'` but the file is `photo-studio.png`. The ternary in step 1 handles it. Or rename the building id to `'photo-studio'` everywhere — your call.

## What this swap fixes

- Every building is now a real on-palette pixel sprite, not an emoji
- Background is a tiled grass field with subtle variation (not solid green)
- Character is a proper hooded figure with the chunky ink outline
- The idle bob animation makes the character look alive at rest
- Completed buildings sparkle (if you added the `building-done` keyframe from earlier)

## What it doesn't fix (acceptable for v1)

- **No walking sprite cycle.** Character is single frame, just slides. Idle bob fakes liveliness. For real walk frames you'd need to source/draw 2 directional frames per direction (8 sprites) and `background-position`-animate. Skip for v1.
- **No animated buildings.** No chimney smoke, no water ripple at the well. Static sprites. Acceptable.
- **Buildings are objects, not architecture.** A book represents the library, a chest represents memory studio, etc. This is intentional — Tiny Dungeon doesn't have literal building sprites and trying to composite them looks worse than clean object icons.

## License

These sprites are from Kenney's Tiny Dungeon pack, licensed **CC0 1.0** (public domain). You can use, modify, distribute freely, with or without credit. Kenney appreciates a shoutout (kenney.nl) but doesn't require it.

If you want true literal town buildings (houses with doors and chimneys), grab Kenney's actual **Tiny Town** pack from https://kenney.nl/assets/tiny-town — same CC0 license, different art.

## Roll back to emojis

If you hate the look, the original code uses emoji. Just don't copy the PNGs and don't change the code — emoji placeholders still work.
