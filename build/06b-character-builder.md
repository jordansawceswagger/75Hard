# 06b — Character Builder (shared component)

## GOAL

A real character customization screen, not just a random reroll. The user picks from preset options for skin tone, hair style + color, eyes, mouth, and accessories. The result is a Dicebear pixel-art avatar with all those traits baked in. Used by `Onboarding` (step 1) and `Profile` (replace the reroll-only flow).

This is the "make my guy" moment. Friends will compare characters. Make it feel like a Pokemon character select.

---

## WHY DICEBEAR + URL PARAMS (not a custom sprite system)

Dicebear's pixel-art style supports per-trait URL parameters. Instead of `?seed=jordan` (random), we can pass `?hair=long01&hairColor=8b4513&skinColor=ffe4c0&eyes=variant05&...` for full control. Same API, no new dependency, same free CDN.

We store the full options object as JSON in the existing `users.avatar_seed` column (now misnamed — but no schema change needed). When rendering, we serialize the object into a query string and hit Dicebear.

This means: zero asset work, infinite combinations, deterministic preview, character syncs across devices.

---

## STEPS

### 1. Define the option presets

Create `src/lib/character.js`:

```js
// Dicebear pixel-art trait options. Values come from
// https://www.dicebear.com/playground/?style=pixel-art
// Pick the ones that look distinct + flattering. More options = more decision fatigue.

export const TRAITS = {
  skinColor: [
    { value: 'ffe4c0', label: 'Light' },
    { value: 'eac393', label: 'Tan' },
    { value: 'b68655', label: 'Medium' },
    { value: '8d5524', label: 'Brown' },
    { value: '5c3317', label: 'Deep' },
  ],
  hair: [
    { value: 'short01', label: 'Short A' },
    { value: 'short02', label: 'Short B' },
    { value: 'short03', label: 'Short C' },
    { value: 'short04', label: 'Buzz' },
    { value: 'short05', label: 'Mohawk' },
    { value: 'long01',  label: 'Long A' },
    { value: 'long02',  label: 'Long B' },
    { value: 'long03',  label: 'Long C' },
    { value: 'long04',  label: 'Long D' },
    { value: 'long05',  label: 'Long E' },
    { value: 'long06',  label: 'Pigtails' },
    { value: 'long07',  label: 'Ponytail' },
  ],
  hairColor: [
    { value: '000000', label: 'Black' },
    { value: '5b3a29', label: 'Brown' },
    { value: 'd2691e', label: 'Auburn' },
    { value: 'f4a460', label: 'Blonde' },
    { value: 'cfcfcf', label: 'Silver' },
    { value: 'ff7b7b', label: 'Coral' },
    { value: 'c8b6ff', label: 'Lavender' },
    { value: 'b8e0d2', label: 'Mint' },
  ],
  eyes: [
    { value: 'variant01', label: 'Round' },
    { value: 'variant02', label: 'Sleepy' },
    { value: 'variant03', label: 'Wink' },
    { value: 'variant04', label: 'Sharp' },
    { value: 'variant05', label: 'Wide' },
    { value: 'variant06', label: 'Squint' },
  ],
  eyesColor: [
    { value: '5b3a29', label: 'Brown' },
    { value: '4a6b8a', label: 'Blue' },
    { value: '3d6b3d', label: 'Green' },
    { value: '6b4a8a', label: 'Violet' },
    { value: '2d2d44', label: 'Ink' },
  ],
  mouth: [
    { value: 'happy01', label: 'Smile' },
    { value: 'happy02', label: 'Grin' },
    { value: 'happy03', label: 'Smirk' },
    { value: 'sad01',   label: 'Pout' },
    { value: 'sad02',   label: 'Flat' },
  ],
  accessories: [
    { value: 'none',       label: 'None' },
    { value: 'variant01',  label: 'Glasses' },
    { value: 'variant02',  label: 'Headband' },
    { value: 'variant03',  label: 'Eyepatch' },
    { value: 'variant04',  label: 'Earring' },
  ],
};

// Default config = "blank slate" first-time character
export const DEFAULT_CONFIG = {
  skinColor:   'ffe4c0',
  hair:        'short01',
  hairColor:   '5b3a29',
  eyes:        'variant01',
  eyesColor:   '5b3a29',
  mouth:       'happy01',
  accessories: 'none',
};

// Build the Dicebear URL from a config object
export function avatarUrl(config, size = 96) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(config)) {
    if (key === 'accessories' && value === 'none') {
      params.set('accessoriesProbability', '0');
    } else {
      params.set(key, value);
      if (key === 'accessories') params.set('accessoriesProbability', '100');
    }
  }
  params.set('size', String(size * 2)); // 2x for retina, scaled by CSS
  return `https://api.dicebear.com/9.x/pixel-art/svg?${params.toString()}`;
}

// Parse stored config (it's JSON in users.avatar_seed)
export function parseConfig(stored) {
  if (!stored) return DEFAULT_CONFIG;
  try {
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // Legacy: if avatar_seed is still a plain seed string from old code,
    // treat as default config + use seed as fallback. Migrate on next save.
    return DEFAULT_CONFIG;
  }
}

export function serializeConfig(config) {
  return JSON.stringify(config);
}

// Pick a random preset for a single trait
export function randomize(config = DEFAULT_CONFIG) {
  const next = { ...config };
  for (const key of Object.keys(TRAITS)) {
    const opts = TRAITS[key];
    next[key] = opts[Math.floor(Math.random() * opts.length)].value;
  }
  return next;
}
```

### 2. Update the Avatar component to accept a config

Replace `src/components/Avatar.jsx`:

```jsx
import { avatarUrl, parseConfig } from '../lib/character';

export default function Avatar({ config, size = 64 }) {
  const cfg = parseConfig(config);
  return (
    <img
      src={avatarUrl(cfg, size)}
      alt=""
      width={size}
      height={size}
      className="pixelated"
      style={{
        background: 'var(--cream)',
        border: '3px solid var(--ink)',
        display: 'block',
      }}
    />
  );
}
```

Old `Avatar` took `seed`. New takes `config`. **Update every call site:**
- `src/screens/Friends.jsx`: change `<Avatar seed={u.avatar_seed} size={80} />` → `<Avatar config={u.avatar_seed} size={80} />`
- `src/screens/Profile.jsx`: change `<Avatar seed={seed} size={96} />` → `<Avatar config={config} size={96} />`
- `src/screens/Onboarding.jsx`: change `<Avatar seed={avatarSeed} size={128} />` → `<Avatar config={config} size={128} />`

### 3. Build the CharacterBuilder component

Create `src/components/CharacterBuilder.jsx`:

```jsx
import { useState } from 'react';
import { TRAITS, DEFAULT_CONFIG, randomize } from '../lib/character';
import { sfx } from '../lib/sfx';
import Avatar from './Avatar';
import PixelButton from './PixelButton';

const TRAIT_ORDER = ['skinColor', 'hair', 'hairColor', 'eyes', 'eyesColor', 'mouth', 'accessories'];
const TRAIT_LABELS = {
  skinColor: 'SKIN',
  hair: 'HAIR',
  hairColor: 'HAIR COLOR',
  eyes: 'EYES',
  eyesColor: 'EYE COLOR',
  mouth: 'MOUTH',
  accessories: 'EXTRA',
};

export default function CharacterBuilder({ value, onChange, onConfirm, confirmLabel = 'KEEP →' }) {
  const config = value || DEFAULT_CONFIG;
  const [activeTab, setActiveTab] = useState(TRAIT_ORDER[0]);

  function setTrait(key, val) {
    sfx.play('tap');
    onChange({ ...config, [key]: val });
  }

  function reroll() {
    sfx.play('complete');
    onChange(randomize(config));
  }

  const tabOptions = TRAITS[activeTab];
  const isColorTab = activeTab.toLowerCase().includes('color');

  return (
    <div>
      {/* Preview */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Avatar config={config} size={128} />
      </div>

      {/* Trait tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        marginBottom: 12,
      }}>
        {TRAIT_ORDER.map(key => (
          <button
            key={key}
            onClick={() => { sfx.play('tap'); setActiveTab(key); }}
            style={{
              padding: '8px 4px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              border: '2px solid var(--ink)',
              background: activeTab === key ? 'var(--peach)' : '#fff',
              cursor: 'pointer',
            }}
          >
            {TRAIT_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Trait options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        marginBottom: 16,
      }}>
        {tabOptions.map(opt => {
          const isActive = config[activeTab] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTrait(activeTab, opt.value)}
              style={{
                padding: 8,
                fontFamily: 'VT323, monospace',
                fontSize: 14,
                border: `3px solid ${isActive ? 'var(--peach)' : 'var(--ink)'}`,
                background: isColorTab ? `#${opt.value}` : '#fff',
                color: isColorTab && isDarkHex(opt.value) ? '#fff' : 'var(--ink)',
                boxShadow: isActive ? '2px 2px 0 var(--shadow)' : 'none',
                cursor: 'pointer',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isColorTab ? '' : opt.label}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <PixelButton onClick={reroll}>SURPRISE ME</PixelButton>
        {onConfirm && <PixelButton variant="success" onClick={onConfirm}>{confirmLabel}</PixelButton>}
      </div>
    </div>
  );
}

function isDarkHex(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
```

### 4. Update Onboarding step 1 to use CharacterBuilder

Replace step 1 of `src/screens/Onboarding.jsx` (the avatar reroll section):

```jsx
import CharacterBuilder from '../components/CharacterBuilder';
import { DEFAULT_CONFIG, serializeConfig } from '../lib/character';

// Replace state:
const [config, setConfig] = useState(DEFAULT_CONFIG);

// Replace step 1 return block:
if (step === 1) {
  return (
    <PixelCard title="BUILD YOUR SPRITE">
      <CharacterBuilder
        value={config}
        onChange={setConfig}
        onConfirm={() => setStep(2)}
        confirmLabel="KEEP →"
      />
    </PixelCard>
  );
}

// Update finish() to save config instead of seed:
async function finish() {
  sfx.play('day_done');
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: session.user.id,
      email: session.user.email,
      display_name: name,
      avatar_seed: serializeConfig(config), // now stores JSON
      start_date: startDate,
    })
    .select()
    .single();
  if (error) { console.error(error); return; }
  setProfile(data);
  navigate('/');
}
```

### 5. Update Profile to use CharacterBuilder

Replace the SPRITE card in `src/screens/Profile.jsx`:

```jsx
import CharacterBuilder from '../components/CharacterBuilder';
import { parseConfig, serializeConfig } from '../lib/character';

// Replace state:
const [config, setConfig] = useState(parseConfig(profile?.avatar_seed));

// Replace the SPRITE card:
<PixelCard title="SPRITE">
  <CharacterBuilder
    value={config}
    onChange={setConfig}
  />
</PixelCard>

// Update save():
async function save() {
  sfx.play('complete');
  const { data } = await supabase
    .from('users')
    .update({
      display_name: name,
      avatar_seed: serializeConfig(config),
      sfx_enabled: sfxOn,
    })
    .eq('id', session.user.id)
    .select()
    .single();
  setProfile(data);
  sfx.setEnabled(sfxOn);
}
```

Remove the old `reroll()` function and the standalone REROLL button (CharacterBuilder has its own SURPRISE ME).

### 6. Smoke test

1. Delete your `users` row → reload → routed to onboarding
2. Enter name → NEXT → see character builder with 7 tabs and a 128px preview
3. Tap SKIN → see 5 color swatches → tap one → preview updates instantly
4. Tap HAIR → see 12 hair style options → pick one
5. Cycle through all 7 tabs and pick each
6. SURPRISE ME → randomizes everything
7. KEEP → step 2 (install tutorial) → DONE → land on Today
8. Go to PARTY → your avatar appears with the customized sprite
9. Go to ME → SPRITE card shows the same builder → change something → SAVE → reload → change persists

---

## DONE WHEN

- [ ] `lib/character.js` exists with TRAITS, DEFAULT_CONFIG, avatarUrl, parseConfig, serializeConfig
- [ ] `Avatar` component accepts `config` prop and renders the customized sprite
- [ ] `CharacterBuilder` component renders preview + 7 tabs + option grid
- [ ] Color swatches show as actual color blocks (not labels)
- [ ] Tapping any option updates the preview instantly
- [ ] SURPRISE ME randomizes all 7 traits
- [ ] Onboarding step 1 uses CharacterBuilder, saves config as JSON
- [ ] Profile SPRITE card uses CharacterBuilder, SAVE persists the config
- [ ] Friends screen shows everyone's customized avatar
- [ ] All call sites of Avatar updated to pass `config` not `seed`

---

## GOTCHAS

- **Dicebear API rate limits.** Each character change triggers a new HTTP request. The service worker caches them after first load — but during heavy customization (clicking through every option), expect a brief flash. Not a real problem at 4 users.
- **Color codes have no `#` prefix in Dicebear URLs.** `skinColor=ffe4c0` works; `skinColor=%23ffe4c0` returns an error. The encoder in `URLSearchParams` won't double-encode if you store as plain hex.
- **The `accessories=none` case is special.** Dicebear doesn't have a "none" variant — you set `accessoriesProbability=0`. The `avatarUrl()` helper handles this.
- **Legacy seed strings will appear as DEFAULT_CONFIG** after this migration. The `parseConfig()` try/catch returns DEFAULT when the stored value isn't valid JSON. Existing users see their character "reset" — they re-pick once. Acceptable for a 4-user app.
- **Dicebear trait values can change between versions.** This file pins `9.x` in the URL. If you bump to 10.x and traits get renamed, you'll see broken avatars. Test before upgrading.
- **The trait values listed in `TRAITS`** are a curated subset, not the full Dicebear catalog. The full set is at https://www.dicebear.com/playground/?style=pixel-art — pull more values from there if your friends want more options.

---

## NEXT

`build/07-onboarding.md` — already references this component. After this is built, onboarding works end-to-end.
