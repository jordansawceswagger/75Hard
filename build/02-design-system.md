# 02 — Design System

## GOAL

A locked-in palette, font loadout, NES.css color overrides, sound effects directory, and 3 reusable React components (PixelButton, PixelCard, PixelCheckbox). Every screen from here forward composes these.

---

## STEPS

### 1. Generate the 4 sound effects

Go to https://sfxr.me and create these 4 sounds. For each: click the preset name (left sidebar), then **Export → WAV** and save with the filename below.

| File | Preset | When it plays |
|---|---|---|
| `tap.wav` | Click | Every checkbox/button tap |
| `complete.wav` | Pickup/Coin | One task marked done |
| `day_done.wav` | Powerup | All 8 tasks complete for the day |
| `streak_break.wav` | Hit/Hurt | Day failed (reset to 1) |

Save all 4 into `public/sfx/`. Total filesize should be under 20KB combined.

### 2. Add the icon assets

Place these in `public/`:
- `apple-touch-icon.png` — 180×180 pixel-art icon
- `pwa-192x192.png` — 192×192
- `pwa-512x512.png` — 512×512
- `favicon.ico` — 32×32

If you don't have icons yet, generate placeholder pixel art at https://www.piskelapp.com (free in-browser pixel art editor) or use any AI image generator and run through a "pixelate" filter. Don't block on this — placeholders are fine for build, polish in step 10.

### 3. Write the global CSS

Replace `src/index.css` entirely with:

```css
/* === KAWAII 8-BIT PALETTE === */
:root {
  --cream:    #FFF4E0;
  --peach:    #FFB5A7;
  --lavender: #C8B6FF;
  --mint:     #B8E0D2;
  --coral:    #FF7B7B;
  --ink:      #2D2D44;
  --shadow:   rgba(45, 45, 68, 0.2);
}

/* === RESET === */
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  height: 100%;
  background: var(--cream);
  color: var(--ink);
  font-family: 'VT323', monospace;
  font-size: 20px;
  line-height: 1.4;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}

#root {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh; /* dynamic viewport for iOS */
}

/* === TYPOGRAPHY === */
h1, h2, h3, .pixel-display {
  font-family: 'Press Start 2P', monospace;
  color: var(--ink);
  letter-spacing: 0.05em;
}

h1 { font-size: 24px; line-height: 1.6; }
h2 { font-size: 18px; line-height: 1.6; }
h3 { font-size: 14px; line-height: 1.6; }

/* === NES.css COLOR OVERRIDES === */
.nes-container {
  background-color: #fff !important;
  border-color: var(--ink) !important;
  box-shadow: 4px 4px 0 var(--shadow) !important;
}

.nes-container.is-rounded {
  border-radius: 0 !important; /* pixel = no rounding */
}

/* === IMAGES === */
img.pixelated,
.pixelated img {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* === SAFE AREA (iPhone notch) === */
@supports (padding: max(0px)) {
  #root {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
    padding-top: max(16px, env(safe-area-inset-top));
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
```

### 4. Build the sound effect helper

Create `src/lib/sfx.js`:

```js
const cache = {};

function getAudio(name) {
  if (!cache[name]) {
    cache[name] = new Audio(`/sfx/${name}.wav`);
    cache[name].volume = 0.4;
  }
  return cache[name];
}

let enabled = true;

export const sfx = {
  setEnabled(v) { enabled = v; },
  play(name) {
    if (!enabled) return;
    const a = getAudio(name);
    a.currentTime = 0;
    a.play().catch(() => {}); // ignore iOS autoplay-blocked errors
  },
};
```

Why this shape: iOS Safari blocks `Audio.play()` until the user has interacted with the page. The `.catch(() => {})` swallows the first-interaction error silently. After the first tap, every subsequent sound works.

### 5. Build the 3 core components

Create `src/components/PixelButton.jsx`:

```jsx
import { sfx } from '../lib/sfx';

export default function PixelButton({ children, onClick, variant = 'primary', disabled, type = 'button' }) {
  const cls = {
    primary: 'nes-btn is-primary',
    success: 'nes-btn is-success',
    warning: 'nes-btn is-warning',
    error: 'nes-btn is-error',
    default: 'nes-btn',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      className={cls}
      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}
      onClick={(e) => {
        sfx.play('tap');
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
```

Create `src/components/PixelCard.jsx`:

```jsx
export default function PixelCard({ title, children, dark = false }) {
  const cls = `nes-container ${dark ? 'is-dark' : ''} ${title ? 'with-title' : ''}`;
  return (
    <div className={cls} style={{ marginBottom: 16 }}>
      {title && <p className="title" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{title}</p>}
      {children}
    </div>
  );
}
```

Create `src/components/PixelCheckbox.jsx`:

```jsx
import { sfx } from '../lib/sfx';

export default function PixelCheckbox({ label, checked, onChange }) {
  return (
    <label className="nes-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', cursor: 'pointer' }}>
      <input
        type="checkbox"
        className="nes-checkbox"
        checked={checked}
        onChange={(e) => {
          sfx.play(e.target.checked ? 'complete' : 'tap');
          onChange?.(e.target.checked);
        }}
      />
      <span style={{ fontSize: 22 }}>{label}</span>
    </label>
  );
}
```

### 6. Smoke test

Replace `src/App.jsx` with:

```jsx
import { useState } from 'react';
import PixelButton from './components/PixelButton';
import PixelCard from './components/PixelCard';
import PixelCheckbox from './components/PixelCheckbox';

export default function App() {
  const [done, setDone] = useState(false);
  return (
    <>
      <h1>75 HARD</h1>
      <PixelCard title="TEST">
        <p>Day 1 of 75</p>
        <PixelCheckbox label="Workout 1 (45 min)" checked={done} onChange={setDone} />
        <PixelButton variant="success" onClick={() => alert('clicked')}>SAVE</PixelButton>
      </PixelCard>
    </>
  );
}
```

Run `npm run dev`. You should see:
- Cream background, dark "75 HARD" header in pixel font
- A bordered card with the test content
- A working checkbox that plays a sound on tap
- A green "SAVE" button that plays a sound and alerts

If any of those fail, fix before moving on. This is the foundation everything else sits on.

---

## DONE WHEN

- [ ] 4 wav files exist in `public/sfx/`
- [ ] Palette CSS variables defined in `src/index.css`
- [ ] PixelButton, PixelCard, PixelCheckbox all rendering in the smoke test
- [ ] Sounds play on tap on desktop (test on phone in next step — iOS needs user interaction first)
- [ ] Background is cream, fonts are pixelated, no rounded corners anywhere

---

## GOTCHAS

- **iOS audio:** Safari blocks audio until first user interaction. The `.catch(() => {})` hides the error, but you might think sound is broken on initial load. It works after the first tap.
- **NES.css quirks:** The framework injects its own font assumptions. The inline `fontFamily` overrides on PixelButton are intentional — don't remove them.
- **Font flash:** Press Start 2P is loaded from Google Fonts via CDN. There's a ~200ms FOUT (flash of unstyled text). Acceptable for v1.

---

## NEXT

`build/03-auth.md` — magic-link sign-in, session handling, the protected route wrapper.
