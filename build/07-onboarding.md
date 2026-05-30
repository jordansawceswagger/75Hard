# 07 — Onboarding (NEW GAME)

## GOAL

First-time users (signed in but no `users` row yet) see a 3-step onboarding: pick name + start date, then a screen showing their generated Dicebear avatar with regen option, then a tutorial for "Add to Home Screen" on iOS. After they finish, their `users` row is created and they're routed to Today.

---

## STEPS

### 1. Build the Onboarding screen

Create `src/screens/Onboarding.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { sfx } from '../lib/sfx';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';
import Avatar from '../components/Avatar';

export default function Onboarding() {
  const { session, setProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [avatarSeed, setAvatarSeed] = useState(crypto.randomUUID().slice(0, 8));

  async function finish() {
    sfx.play('day_done');
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        display_name: name,
        avatar_seed: avatarSeed,
        start_date: startDate,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    setProfile(data);
    navigate('/');
  }

  if (step === 0) {
    return (
      <PixelCard title="NEW QUEST">
        <p style={{ marginBottom: 16 }}>What's your name, adventurer?</p>
        <input
          className="nes-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <p style={{ marginTop: 16, marginBottom: 8 }}>Start date:</p>
        <input
          type="date"
          className="nes-input"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <div style={{ marginTop: 20 }}>
          <PixelButton variant="primary" onClick={() => name && setStep(1)} disabled={!name}>
            NEXT →
          </PixelButton>
        </div>
      </PixelCard>
    );
  }

  if (step === 1) {
    return (
      <PixelCard title="YOUR SPRITE">
        <div style={{ textAlign: 'center' }}>
          <Avatar seed={avatarSeed} size={128} />
          <p style={{ marginTop: 16 }}>Like it?</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <PixelButton onClick={() => setAvatarSeed(crypto.randomUUID().slice(0, 8))}>
              REROLL
            </PixelButton>
            <PixelButton variant="success" onClick={() => setStep(2)}>
              KEEP →
            </PixelButton>
          </div>
        </div>
      </PixelCard>
    );
  }

  // step 2: Install tutorial
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone;

  if (isStandalone) {
    // Already installed — skip to finish
    return (
      <PixelCard title="READY">
        <p>You're installed and ready to start the quest.</p>
        <p style={{ marginTop: 12 }}>Hello, {name}!</p>
        <div style={{ marginTop: 16 }}>
          <PixelButton variant="success" onClick={finish}>
            START DAY 1
          </PixelButton>
        </div>
      </PixelCard>
    );
  }

  return (
    <PixelCard title="INSTALL ON HOME SCREEN">
      <p style={{ marginBottom: 12 }}>
        For the full app experience, add this to your home screen:
      </p>
      <ol style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.8 }}>
        <li>Tap the <strong>Share</strong> button below ⤴</li>
        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>Add</strong> in the top right</li>
        <li>Open the new 75 HARD icon from your home screen</li>
      </ol>
      <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 16 }}>
        (You can also skip this and use it in Safari, but it looks better installed.)
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <PixelButton onClick={finish}>
          SKIP
        </PixelButton>
        <PixelButton variant="success" onClick={finish}>
          DONE — START!
        </PixelButton>
      </div>
    </PixelCard>
  );
}
```

### 2. Add the onboarding redirect logic

Update `src/App.jsx` — replace `Protected` with a smarter version that checks for profile and routes to onboarding if missing:

```jsx
import Onboarding from './screens/Onboarding';

function Protected({ children, requireProfile = true }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <p style={{padding: 20}}>Loading...</p>;
  if (!session) return <Navigate to="/signin" replace />;
  if (requireProfile && !profile) return <Navigate to="/onboarding" replace />;
  return children;
}

// In <Routes>:
<Route path="/onboarding" element={
  <Protected requireProfile={false}><Onboarding /></Protected>
} />
```

### 3. Smoke test

1. Delete your `users` row to simulate first-time user:
   ```sql
   delete from public.users where id = auth.uid();
   ```
2. Reload the app — you should be redirected to `/onboarding`
3. Enter your name → tap NEXT
4. See an avatar → tap REROLL a few times (each reroll generates a new sprite) → tap KEEP
5. See the install tutorial (or "READY" if already installed)
6. Tap DONE → you should land on Today with your new profile

If after onboarding you immediately get bounced back to onboarding, the insert into `users` failed. Check console for RLS error.

---

## DONE WHEN

- [ ] Signing in without a `users` row routes to `/onboarding`
- [ ] Step 0 collects name + start date
- [ ] Step 1 shows the Dicebear avatar; reroll works
- [ ] Step 2 shows install instructions (or auto-skips if already standalone)
- [ ] Submitting creates the `users` row with correct data
- [ ] After onboarding, the user is routed to `/` (Today)

---

## GOTCHAS

- **`window.navigator.standalone` is iOS-only.** Android Chrome uses `matchMedia('(display-mode: standalone)')`. The check uses both for safety.
- **The "Share" button** is at the bottom on iPhone Safari. On iPad it's at the top. Your instructions assume iPhone — fine since friends use phones.
- **If a user signs in on desktop**, they'll see the install tutorial too. Desktop Safari does support "Add to Dock" since macOS Sonoma, but the wording is wrong. Acceptable for v1 — desktop is rare for this use case.

---

## NEXT

`build/08-profile-screen.md` — the boring-but-necessary Profile screen.
