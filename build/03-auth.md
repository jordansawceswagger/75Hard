# 03 — Auth (Magic Link)

## GOAL

Friends sign in by entering their email and clicking a magic link. Session persists across reloads. Protected routes redirect to sign-in if no session. After first sign-in, the user is auto-created in the `users` table.

---

## STEPS

### 1. Configure Supabase Auth

Supabase dashboard → Authentication → Providers → Email:
- **Enable Email provider**: ON
- **Confirm email**: OFF (turn off for v1, you trust the 4 friends not to typo their email; you can turn back on later)
- **Secure email change**: ON

Authentication → URL Configuration:
- **Site URL**: `http://localhost:5173` for dev (you'll add the Cloudflare Pages URL in step 10)
- **Redirect URLs**: add `http://localhost:5173/**` and later `https://your-app.pages.dev/**`

### 2. Build the auth context

Create `src/lib/auth.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, profile, setProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

Note: `profile` is `null` after auth but before the user has completed onboarding (no row in `users` yet). The Onboarding screen (step 07) creates that row.

### 3. Build the SignIn screen

Create `src/screens/SignIn.jsx`:

```jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <PixelCard title="LOGIN">
      {status === 'sent' ? (
        <>
          <p>Check your email for a link.</p>
          <p style={{ marginTop: 12, fontSize: 16, opacity: 0.7 }}>
            (it may take ~30 seconds)
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ marginBottom: 12 }}>Enter your email:</p>
          <input
            type="email"
            required
            className="nes-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
            style={{ fontFamily: 'VT323, monospace', fontSize: 20 }}
          />
          <div style={{ marginTop: 16 }}>
            <PixelButton variant="primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING...' : 'SEND LINK'}
            </PixelButton>
          </div>
          {status === 'error' && (
            <p style={{ color: 'var(--coral)', marginTop: 12 }}>{error}</p>
          )}
        </form>
      )}
    </PixelCard>
  );
}
```

### 4. Wire up routing + protected routes

Install if you haven't: `npm install react-router-dom`

Replace `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import SignIn from './screens/SignIn';

function Protected({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/signin" replace />;
  return children;
}

function HomePlaceholder() {
  const { session, profile } = useAuth();
  return (
    <div>
      <h1>75 HARD</h1>
      <p>Signed in as {session.user.email}</p>
      <p>Profile: {profile ? profile.display_name : '(no profile yet — needs onboarding)'}</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<Protected><HomePlaceholder /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### 5. Smoke test

```bash
npm run dev
```

1. Open `http://localhost:5173` → should redirect to `/signin`
2. Enter your email → click SEND LINK → "Check your email" should appear
3. Check inbox (Supabase emails arrive in 5-30 sec) → click the magic link
4. You should land back on `/` with "Signed in as you@email.com" and "(no profile yet — needs onboarding)"

If the magic link redirects to a Supabase URL with a hash but nothing happens, check:
- Site URL in Supabase settings includes `http://localhost:5173`
- Redirect URLs includes `http://localhost:5173/**`

### 6. Add a sign-out button to test session clearing

Add to `HomePlaceholder`:

```jsx
import { supabase } from './lib/supabase';
import PixelButton from './components/PixelButton';

// inside HomePlaceholder, after the <p> tags:
<PixelButton variant="error" onClick={() => supabase.auth.signOut()}>
  SIGN OUT
</PixelButton>
```

Click it. You should bounce back to `/signin`. Sign back in. Session should persist on page reload.

---

## DONE WHEN

- [ ] You can sign in with your real email and receive a magic link
- [ ] Clicking the link logs you in and shows your email on the home placeholder
- [ ] Refreshing the page keeps you signed in
- [ ] Sign-out button bounces you to `/signin`
- [ ] Hitting `/` while signed out redirects to `/signin`
- [ ] The "(no profile yet — needs onboarding)" message appears (this is correct — the `users` table row gets created in step 07)

---

## GOTCHAS

- **Magic link emails may go to spam.** Tell your friends to check spam folder on first sign-in. After they whitelist `noreply@mail.supabase.io`, it's fine.
- **Supabase free tier rate-limits emails to ~30/hour.** Plenty for 4 users but be aware if you're testing repeatedly.
- **The redirect URL must EXACTLY match what's whitelisted.** `http://localhost:5173` and `http://localhost:5173/` are not the same. Use the wildcard `/**` form to be safe.
- **`profile` will be null until step 07** runs and creates the `users` row. Any code that assumes profile is non-null needs to guard against null.

---

## NEXT

`build/04-today-screen.md` — the main screen. The 8 tasks, the water counter, the photo upload, the confetti on completion.
