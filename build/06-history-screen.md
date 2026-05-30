# 06 — History Screen (QUEST LOG)

## GOAL

A 5-column × 15-row grid of 75 pixel squares. Mint = complete, coral = failed, cream = future. Tap any cell to see that day's photo and which tasks were missed. This is the dopamine loop — watching the grid fill up over 75 days is the whole psychological payoff.

---

## STEPS

### 1. Build the History screen

Create `src/screens/History.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { daysSince } from '../lib/days';
import PixelCard from '../components/PixelCard';

const TOTAL = 75;

const TASK_LABELS = {
  workout_1: 'Workout 1',
  workout_2_outdoor: 'Outdoor workout',
  diet: 'Diet',
  reading: '10 pages',
  water: '120oz water',
  photo: 'Progress photo',
  no_alcohol: 'No alcohol',
  sleep: '8h sleep',
};

function whatMissed(log) {
  if (!log) return ['(no log)'];
  const missed = [];
  if (!log.workout_1) missed.push(TASK_LABELS.workout_1);
  if (!log.workout_2_outdoor) missed.push(TASK_LABELS.workout_2_outdoor);
  if (!log.diet) missed.push(TASK_LABELS.diet);
  if (log.reading_pages < 10) missed.push(`${TASK_LABELS.reading} (got ${log.reading_pages})`);
  if (log.water_count < 3) missed.push(`${TASK_LABELS.water} (got ${log.water_count}/3)`);
  if (!log.photo_url) missed.push(TASK_LABELS.photo);
  if (!log.no_alcohol) missed.push(TASK_LABELS.no_alcohol);
  if (log.sleep_hours < 8) missed.push(`${TASK_LABELS.sleep} (got ${log.sleep_hours}h)`);
  return missed;
}

export default function History() {
  const { session, profile } = useAuth();
  const [logs, setLogs] = useState({}); // { day_number: log }
  const [selected, setSelected] = useState(null);
  const today = profile ? daysSince(profile.start_date) : 1;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        const byDay = {};
        for (const log of data || []) byDay[log.day_number] = log;
        setLogs(byDay);
      });
  }, [profile, session]);

  return (
    <>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>QUEST LOG</h1>

      <PixelCard>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4,
        }}>
          {Array.from({ length: TOTAL }, (_, i) => {
            const day = i + 1;
            const log = logs[day];
            const isPast = day < today;
            const isToday = day === today;
            const complete = log?.all_complete;
            const bg = isToday ? 'var(--lavender)'
                     : complete ? 'var(--mint)'
                     : isPast && !complete ? 'var(--coral)'
                     : 'var(--cream)';
            return (
              <button
                key={day}
                onClick={() => setSelected({ day, log })}
                style={{
                  aspectRatio: '1 / 1',
                  background: bg,
                  border: '2px solid var(--ink)',
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </PixelCard>

      <PixelCard title="LEGEND">
        <div style={{ display: 'flex', gap: 16, fontSize: 16, flexWrap: 'wrap' }}>
          <Legend color="var(--mint)" label="COMPLETE" />
          <Legend color="var(--coral)" label="FAILED" />
          <Legend color="var(--lavender)" label="TODAY" />
          <Legend color="var(--cream)" label="FUTURE" />
        </div>
      </PixelCard>

      {selected && (
        <DayModal day={selected.day} log={selected.log} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 16, height: 16, background: color, border: '2px solid var(--ink)' }} />
      {label}
    </span>
  );
}

function DayModal({ day, log, onClose }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const missed = whatMissed(log);

  useEffect(() => {
    if (log?.photo_url) {
      supabase.storage
        .from('progress-photos')
        .createSignedUrl(log.photo_url, 3600)
        .then(({ data }) => setPhotoUrl(data?.signedUrl));
    }
  }, [log]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(45, 45, 68, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--cream)',
        border: '4px solid var(--ink)',
        padding: 20,
        maxWidth: 360,
        width: '100%',
        boxShadow: '6px 6px 0 rgba(45,45,68,0.5)',
      }}>
        <h2 style={{ marginBottom: 12 }}>DAY {day}</h2>
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            className="pixelated"
            style={{ width: 192, height: 192, display: 'block', margin: '0 auto 12px' }}
          />
        )}
        {log?.all_complete ? (
          <p style={{ color: 'var(--ink)', background: 'var(--mint)', padding: 8, textAlign: 'center' }}>
            ALL 8 COMPLETE ✓
          </p>
        ) : missed.length === 0 ? (
          <p>No data for this day yet.</p>
        ) : (
          <>
            <p style={{ marginBottom: 8 }}>Missed:</p>
            <ul style={{ paddingLeft: 20 }}>
              {missed.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </>
        )}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="nes-btn"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11 }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Add to nav

Update `src/components/BottomNav.jsx` to include History:

```jsx
const TABS = [
  { to: '/', label: 'TODAY' },
  { to: '/party', label: 'PARTY' },
  { to: '/quest', label: 'QUEST' },
];
```

Update `src/App.jsx`:

```jsx
import History from './screens/History';

// In <Routes>:
<Route path="/quest" element={<Protected><ProtectedLayout><History /></ProtectedLayout></Protected>} />
```

### 3. Smoke test

Go to `/quest`:
- 75 cells should render in a 5×15 grid
- Day 1 should be lavender (today, assuming you just started)
- Cells past today should be cream
- If you've completed today's log fully, day 1 should be mint
- Tap any cell — modal opens with the day number
- Tap a completed cell → see your photo + "ALL 8 COMPLETE"
- Tap an incomplete past cell → see list of what was missed
- Tap outside the modal → it closes

To test "failed" days visually, manually insert a partial log via SQL Editor:

```sql
insert into public.daily_logs (user_id, day_number, log_date, workout_1, water_count)
values (auth.uid(), 2, current_date - 1, true, 1);
```

Reload `/quest` → day 2 should be coral.

---

## DONE WHEN

- [ ] 75 cells render in a 5-column grid
- [ ] Cell colors match the legend (mint/coral/lavender/cream)
- [ ] Tapping a cell opens a modal with the day's data
- [ ] Photo (if present) renders pixelated
- [ ] Modal lists missed tasks specifically
- [ ] Modal closes on backdrop tap or CLOSE button

---

## GOTCHAS

- **Failed days vs. skipped days:** the screen currently treats any past day without `all_complete = true` as "failed" (coral). If you want to distinguish "I tried but missed" from "I didn't log at all," you'd need a `log_started` flag or check for log existence vs. all_complete. Skip for v1 — coral means "didn't finish."
- **The 75-cell grid assumes the user starts at day 1.** If you want to support starting partway through (e.g. a friend joins on day 5 of the group), the day numbering still anchors to `start_date`. Each person's grid is their own quest.

---

## NEXT

`build/07-onboarding.md` — the first-time-user flow. Capture name, start date, reminder time, and teach iOS Add-to-Home-Screen.
