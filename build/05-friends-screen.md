# 05 — Friends Screen (PARTY)

## GOAL

A 2×2 grid showing all 4 users with their Dicebear avatar, current day, today's completion as a pixel progress bar, and 2 reaction buttons (🔥, 💗) that insert into the `reactions` table. Friends who haven't logged today show grayscale + "AFK".

---

## STEPS

### 1. Build the Dicebear avatar component

Create `src/components/Avatar.jsx`:

```jsx
export default function Avatar({ seed, size = 64 }) {
  return (
    <img
      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`}
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

### 2. Build the progress bar

Create `src/components/PixelProgress.jsx`:

```jsx
const TASKS = ['workout_1', 'workout_2_outdoor', 'diet', 'no_alcohol'];

export default function PixelProgress({ log }) {
  if (!log) return null;
  let done = 0;
  for (const t of TASKS) if (log[t]) done++;
  if (log.water_count >= 3) done++;
  if (log.reading_pages >= 10) done++;
  if (log.photo_url) done++;
  if (log.sleep_hours >= 8) done++;
  const total = 8;
  const cells = Array.from({ length: total }, (_, i) => i < done);

  return (
    <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
      {cells.map((on, i) => (
        <div key={i} style={{
          flex: 1, height: 12,
          background: on ? 'var(--mint)' : '#fff',
          border: '2px solid var(--ink)',
        }} />
      ))}
    </div>
  );
}
```

### 3. Build the Friends screen

Create `src/screens/Friends.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { todayISO, daysSince } from '../lib/days';
import { sfx } from '../lib/sfx';
import PixelCard from '../components/PixelCard';
import Avatar from '../components/Avatar';
import PixelProgress from '../components/PixelProgress';

const REACTIONS = ['🔥', '💗'];

export default function Friends() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState({});       // { user_id: log }
  const [reactions, setReactions] = useState({}); // { log_id: [reactions] }

  useEffect(() => {
    loadAll();
    // Realtime subscription for reactions
    const sub = supabase
      .channel('reactions-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        loadAll();
      })
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  async function loadAll() {
    const date = todayISO();
    const [{ data: u }, { data: l }] = await Promise.all([
      supabase.from('users').select('*').order('created_at'),
      supabase.from('daily_logs').select('*').eq('log_date', date),
    ]);
    setUsers(u || []);
    const byUser = {};
    for (const log of l || []) byUser[log.user_id] = log;
    setLogs(byUser);

    const logIds = (l || []).map(x => x.id);
    if (logIds.length) {
      const { data: r } = await supabase.from('reactions').select('*').in('log_id', logIds);
      const byLog = {};
      for (const reaction of r || []) {
        if (!byLog[reaction.log_id]) byLog[reaction.log_id] = [];
        byLog[reaction.log_id].push(reaction);
      }
      setReactions(byLog);
    }
  }

  async function react(log, emoji) {
    sfx.play('complete');
    await supabase.from('reactions').upsert({
      log_id: log.id,
      from_user_id: session.user.id,
      emoji,
    }, { onConflict: 'log_id,from_user_id' });
  }

  return (
    <>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>PARTY</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {users.map(u => {
          const log = logs[u.id];
          const isAfk = !log;
          return (
            <PixelCard key={u.id}>
              <div style={{ textAlign: 'center', filter: isAfk ? 'grayscale(1)' : 'none' }}>
                <Avatar seed={u.avatar_seed} size={80} />
                <div style={{ marginTop: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
                  {u.display_name}
                </div>
                <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
                  LV {daysSince(u.start_date)}
                </div>
                {isAfk ? (
                  <p style={{ marginTop: 8, fontSize: 14 }}>??? AFK</p>
                ) : (
                  <>
                    <PixelProgress log={log} />
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12 }}>
                      {REACTIONS.map(e => {
                        const count = reactions[log.id]?.filter(r => r.emoji === e).length || 0;
                        const mine = reactions[log.id]?.some(
                          r => r.emoji === e && r.from_user_id === session.user.id
                        );
                        const isMe = u.id === session.user.id;
                        return (
                          <button
                            key={e}
                            disabled={isMe}
                            onClick={() => react(log, e)}
                            style={{
                              fontSize: 18, padding: '4px 8px',
                              border: '2px solid var(--ink)',
                              background: mine ? 'var(--peach)' : '#fff',
                              cursor: isMe ? 'default' : 'pointer',
                              opacity: isMe ? 0.5 : 1,
                            }}
                          >
                            {e} {count > 0 && <span style={{ fontSize: 12 }}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </PixelCard>
          );
        })}
      </div>
    </>
  );
}
```

### 4. Add bottom nav (we now have 2 screens)

Create `src/components/BottomNav.jsx`:

```jsx
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'TODAY' },
  { to: '/party', label: 'PARTY' },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxWidth: 480, margin: '0 auto',
      display: 'flex', borderTop: '3px solid var(--ink)',
      background: 'var(--cream)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          style={({ isActive }) => ({
            flex: 1, textAlign: 'center', padding: 16,
            fontFamily: "'Press Start 2P', monospace", fontSize: 11,
            color: 'var(--ink)',
            background: isActive ? 'var(--peach)' : 'transparent',
            textDecoration: 'none',
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

Wrap the protected routes in a layout that includes BottomNav. Update `src/App.jsx`:

```jsx
import Friends from './screens/Friends';
import BottomNav from './components/BottomNav';

function ProtectedLayout({ children }) {
  return (
    <>
      <div style={{ paddingBottom: 80 }}>{children}</div>
      <BottomNav />
    </>
  );
}

// In <Routes>:
<Route path="/" element={<Protected><ProtectedLayout><Today /></ProtectedLayout></Protected>} />
<Route path="/party" element={<Protected><ProtectedLayout><Friends /></ProtectedLayout></Protected>} />
```

### 5. Smoke test (alone for now — you only have 1 user)

You'll only see yourself in the grid until other friends sign up. To test the multi-user flow:
1. Insert a fake user row via SQL Editor:
   ```sql
   insert into public.users (id, email, display_name, avatar_seed, start_date)
   values (gen_random_uuid(), 'fake@test.com', 'Test Friend', 'pixel-friend-1', current_date);
   ```
2. Reload `/party` — you should see 2 cards (you + the fake user as AFK)
3. Click reaction buttons on yourself — they should be disabled (gray, can't react to self)

---

## DONE WHEN

- [ ] `/party` shows a 2×2 grid (will look 1×1 with just you for now)
- [ ] Avatar renders as a pixel-art SVG from Dicebear
- [ ] Bottom nav switches between TODAY and PARTY
- [ ] Reaction buttons insert/update in the `reactions` table (check Supabase Table Editor)
- [ ] Realtime subscription updates the count when you insert via another device or SQL
- [ ] You can't react to your own card

---

## GOTCHAS

- **Dicebear API:** rate limits are generous but if it goes down, your avatars 404. For production, consider self-hosting or caching the SVG to Supabase storage once on first generation. Skip for v1.
- **Realtime subscriptions** need Replication enabled on the `reactions` table in Supabase. Dashboard → Database → Replication → toggle `reactions` to ON. If realtime isn't updating, that's why.
- **The unique constraint on (log_id, from_user_id)** means tapping a reaction button always upserts to that one reaction, never duplicates. Tapping 🔥 then 💗 swaps it. If you want both reactions allowed simultaneously, drop the unique constraint and switch upsert to insert.

---

## NEXT

`build/06-history-screen.md` — the 75-cell pixel grid showing the user's full streak history.
