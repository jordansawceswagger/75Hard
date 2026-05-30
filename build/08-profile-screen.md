# 08 — Profile Screen (INVENTORY)

## GOAL

Lets the user change their display name, reroll their avatar, toggle SFX on/off, see their lifetime stats (current day, total restarts, longest streak), and sign out.

Boring on purpose — don't over-build.

---

## STEPS

### 1. Build the Profile screen

Create `src/screens/Profile.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { sfx } from '../lib/sfx';
import { daysSince } from '../lib/days';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { session, profile, setProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name || '');
  const [sfxOn, setSfxOn] = useState(profile?.sfx_enabled ?? true);
  const [seed, setSeed] = useState(profile?.avatar_seed || '');
  const [stats, setStats] = useState({ logs: 0, completed: 0 });

  useEffect(() => {
    if (!profile) return;
    sfx.setEnabled(profile.sfx_enabled);
    supabase
      .from('daily_logs')
      .select('all_complete')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        const logs = data?.length || 0;
        const completed = data?.filter(l => l.all_complete).length || 0;
        setStats({ logs, completed });
      });
  }, [profile, session]);

  async function save() {
    sfx.play('complete');
    const { data } = await supabase
      .from('users')
      .update({ display_name: name, avatar_seed: seed, sfx_enabled: sfxOn })
      .eq('id', session.user.id)
      .select()
      .single();
    setProfile(data);
    sfx.setEnabled(sfxOn);
  }

  function reroll() {
    sfx.play('tap');
    setSeed(crypto.randomUUID().slice(0, 8));
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!profile) return null;
  const currentDay = daysSince(profile.start_date);

  return (
    <>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>INVENTORY</h1>

      <PixelCard title="STATS">
        <p>Current day: <strong>{currentDay} / 75</strong></p>
        <p>Days logged: <strong>{stats.logs}</strong></p>
        <p>Days completed: <strong>{stats.completed}</strong></p>
        <p>Started: <strong>{profile.start_date}</strong></p>
      </PixelCard>

      <PixelCard title="SPRITE">
        <div style={{ textAlign: 'center' }}>
          <Avatar seed={seed} size={96} />
          <div style={{ marginTop: 12 }}>
            <PixelButton onClick={reroll}>REROLL</PixelButton>
          </div>
        </div>
      </PixelCard>

      <PixelCard title="SETTINGS">
        <p style={{ marginBottom: 8 }}>Display name:</p>
        <input
          className="nes-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 22 }}>
          <input
            type="checkbox"
            className="nes-checkbox"
            checked={sfxOn}
            onChange={e => setSfxOn(e.target.checked)}
          />
          <span>Sound effects</span>
        </label>
        <div style={{ marginTop: 16 }}>
          <PixelButton variant="success" onClick={save}>SAVE</PixelButton>
        </div>
      </PixelCard>

      <PixelCard>
        <p style={{ marginBottom: 12, fontSize: 14, opacity: 0.7 }}>
          Signed in as {session.user.email}
        </p>
        <PixelButton variant="error" onClick={signOut}>SIGN OUT</PixelButton>
      </PixelCard>
    </>
  );
}
```

### 2. Add to nav

Update `src/components/BottomNav.jsx`:

```jsx
const TABS = [
  { to: '/', label: 'TODAY' },
  { to: '/party', label: 'PARTY' },
  { to: '/quest', label: 'QUEST' },
  { to: '/me', label: 'ME' },
];
```

If the tab labels are getting cramped on small phones, drop the font-size on `BottomNav` to 9px or shorten labels.

Update `src/App.jsx`:

```jsx
import Profile from './screens/Profile';

// In <Routes>:
<Route path="/me" element={<Protected><ProtectedLayout><Profile /></ProtectedLayout></Protected>} />
```

### 3. Smoke test

Go to `/me`:
- Stats card shows current day, days logged, days completed
- Sprite shows your current Dicebear avatar
- Tap REROLL → different sprite appears (not yet saved until SAVE)
- Change display name → SAVE → it persists (refresh to verify)
- Toggle SFX off → sounds stop firing across all screens
- Toggle SFX back on → sounds work again
- SIGN OUT → bounces to `/signin`

---

## DONE WHEN

- [ ] Stats render with correct day count
- [ ] Reroll generates new avatar
- [ ] SAVE persists name, seed, and sfx_enabled
- [ ] SFX toggle actually mutes/unmutes sounds globally
- [ ] SIGN OUT works

---

## GOTCHAS

- **The SFX toggle uses an in-memory variable** (`sfx.setEnabled()`), so it resets to "on" on hard reload until the profile loads. Brief race condition — fine in practice.
- **No "delete account" or "reset progress" buttons.** Intentional. If a friend wants to reset, they delete their `users` row via you (or you build a danger-zone screen later).
- **No avatar upload** — Dicebear-only. Adding "upload your own avatar" doubles the storage complexity and breaks the pixel-art consistency. Don't do it.

---

## NEXT

`build/09-pwa-config.md` — wire up vite-plugin-pwa, write the manifest, generate icons, ensure iOS treats this as an installable app.
