# 04 — Town Map (Today Screen)

## GOAL

Replace the checkbox-list Today screen with a tiny top-down pixel-art town. The user sees their character standing in the middle. There are 8 buildings around them — Library, Gym, Park, Well, Kitchen, Photo Studio, Inn, Tavern. Tap a building → character animates over to it → modal opens with that task's input → submit → modal closes + building lights up to show "complete." Tap any empty grass tile → character walks there (no other effect — pure flavor).

This is the heart of the app's identity. Spend the time to get it right.

---

## WHY THIS WORKS

Pokemon-tier engagement loop: every task is a *place* with a *visit*, not a checkbox. The compound effect: friends ask each other "did you visit the library today?" instead of "did you read?" Language shapes habit.

Mechanically simple though: it's just a static background image, 8 absolutely-positioned building sprites with click handlers, and one character sprite that CSS-transitions to a new position. No game engine. No tile pathing. No collision detection.

---

## TASK ↔ BUILDING MAP

| Task                    | Building       | Sprite hint                            |
|-------------------------|----------------|----------------------------------------|
| Workout 1 (45 min)      | Gym            | A small fitness/dojo building          |
| Workout 2 outdoor       | Park           | Trees + path                           |
| Diet adherence          | Kitchen        | A small cafe/diner                     |
| Reading 10 pages        | Library        | Book stack / scroll roof               |
| Water (3 flasks)        | Well           | Stone well with bucket                 |
| Progress photo          | Photo Studio   | Camera shop / mirror shop              |
| No alcohol              | Tavern (closed) | Pub with X / closed sign — special    |
| Sleep 8 hours           | Inn            | Tiny house with a bed sign             |

The Tavern is intentionally a "do NOT visit" building. Tapping it logs `no_alcohol = false` for the day (i.e. you broke the rule). Default state is "don't go in," and the daily log starts with `no_alcohol: true`. This creates a satisfying inversion — every other building is "visit to complete," Tavern is "avoid to complete."

---

## STEPS

### 1. Source or build the art

Read `reference/assets.md` first — it has 3 options ranked by speed (placeholder emoji → free Kenney pack → hand-pixelled). For v1, **start with the placeholder emoji approach** so you can ship the mechanic today and swap art later. Don't block on art.

Drop your assets into `public/town/`:
```
public/town/
├── map-bg.png       (480x480 town background — or use solid grass color in v1)
├── character.png    (32x32, can be a single frame)
├── library.png
├── gym.png
├── park.png
├── well.png
├── kitchen.png
├── photo-studio.png
├── inn.png
└── tavern.png
```

### 2. Build the Town component

Create `src/screens/Today.jsx` (replacing the old one):

```jsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { daysSince, todayISO } from '../lib/days';
import { sfx } from '../lib/sfx';
import PixelConfetti from '../components/PixelConfetti';
import BuildingModal from '../components/BuildingModal';

const MAP_SIZE = 480; // px, matches max-width

// Building layout — x/y are top-left of the building sprite (32x32)
const BUILDINGS = [
  { id: 'library',  task: 'reading',  x:  40, y:  40, label: 'LIBRARY',       emoji: '📚' },
  { id: 'photo',    task: 'photo',    x: 280, y:  40, label: 'PHOTO STUDIO',  emoji: '📸' },
  { id: 'well',     task: 'water',    x:  60, y: 200, label: 'WELL',          emoji: '⛲' },
  { id: 'park',     task: 'outdoor',  x: 380, y: 200, label: 'PARK',          emoji: '🌳' },
  { id: 'gym',      task: 'gym',      x:  40, y: 360, label: 'GYM',           emoji: '🏋️' },
  { id: 'kitchen',  task: 'diet',     x: 200, y: 380, label: 'KITCHEN',       emoji: '🍳' },
  { id: 'inn',      task: 'sleep',    x: 360, y: 360, label: 'INN',           emoji: '🛏️' },
  { id: 'tavern',   task: 'alcohol',  x: 200, y: 220, label: 'TAVERN',        emoji: '🍺' },
];

const EMPTY_LOG = {
  workout_1: false, workout_2_outdoor: false, diet: false,
  reading_pages: 0, water_count: 0, photo_url: null,
  no_alcohol: true, sleep_hours: 0,
};

// Map task slug → which log field shows "complete" for that building
const taskComplete = {
  gym:     log => log.workout_1,
  outdoor: log => log.workout_2_outdoor,
  diet:    log => log.diet,
  reading: log => log.reading_pages >= 10,
  water:   log => log.water_count >= 3,
  photo:   log => !!log.photo_url,
  alcohol: log => log.no_alcohol,   // Tavern shows "lit" when AVOIDED (default true)
  sleep:   log => log.sleep_hours >= 8,
};

export default function Today() {
  const { session, profile } = useAuth();
  const [log, setLog] = useState(EMPTY_LOG);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(0);
  const [charPos, setCharPos] = useState({ x: MAP_SIZE / 2 - 16, y: MAP_SIZE / 2 - 16 });
  const [openTask, setOpenTask] = useState(null);
  const wasComplete = useRef(false);
  const dayNumber = profile ? daysSince(profile.start_date) : 1;

  // Load today's log
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('log_date', todayISO())
        .maybeSingle();
      if (data) setLog(data);
      setLoading(false);
    })();
  }, [profile, session]);

  // Watch for first all-complete → confetti
  useEffect(() => {
    if (log.all_complete && !wasComplete.current) {
      sfx.play('day_done');
      setConfetti(c => c + 1);
      wasComplete.current = true;
    }
  }, [log.all_complete]);

  async function update(patch) {
    const next = { ...log, ...patch };
    setLog(next);
    const { data } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: session.user.id, log_date: todayISO(), day_number: dayNumber, ...next },
        { onConflict: 'user_id,log_date' }
      )
      .select()
      .single();
    if (data) setLog(data);
  }

  function handleBuildingTap(b) {
    sfx.play('tap');
    // Walk character to building
    setCharPos({ x: b.x, y: b.y + 36 }); // position character just below the building
    // Open the task modal after walk animation completes
    setTimeout(() => setOpenTask(b), 350);
  }

  function handleMapTap(e) {
    // Walk to clicked point (no interaction)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left - 16);
    const y = Math.round(e.clientY - rect.top - 16);
    sfx.play('tap');
    setCharPos({
      x: Math.max(0, Math.min(MAP_SIZE - 32, x)),
      y: Math.max(0, Math.min(MAP_SIZE - 32, y)),
    });
  }

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <PixelConfetti trigger={confetti} />
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1>DAY {dayNumber} / 75</h1>
      </div>

      <div
        onClick={handleMapTap}
        style={{
          position: 'relative',
          width: MAP_SIZE,
          height: MAP_SIZE,
          maxWidth: '100%',
          aspectRatio: '1 / 1',
          margin: '0 auto',
          background: '#A8D88A', // grass green; swap for map-bg.png when ready
          border: '4px solid var(--ink)',
          overflow: 'hidden',
          cursor: 'pointer',
          imageRendering: 'pixelated',
        }}
      >
        {/* Buildings */}
        {BUILDINGS.map(b => {
          const done = taskComplete[b.task](log);
          return (
            <button
              key={b.id}
              onClick={(e) => { e.stopPropagation(); handleBuildingTap(b); }}
              style={{
                position: 'absolute',
                left: b.x, top: b.y,
                width: 64, height: 64,
                padding: 0, margin: 0, border: 'none', cursor: 'pointer',
                background: 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              {/* Sprite — placeholder emoji for now; swap with <img src={`/town/${b.id}.png`} /> */}
              <div
                style={{
                  width: 56, height: 56,
                  fontSize: 40, lineHeight: '56px', textAlign: 'center',
                  background: done ? 'var(--mint)' : '#fff',
                  border: '3px solid var(--ink)',
                  boxShadow: done ? '0 0 0 2px var(--mint)' : '2px 2px 0 var(--ink)',
                  filter: done ? 'none' : 'none',
                  opacity: b.task === 'alcohol' && !done ? 0.4 : 1,
                }}
              >
                {b.emoji}
              </div>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 7,
                marginTop: 2,
                color: 'var(--ink)',
                background: 'rgba(255, 244, 224, 0.85)',
                padding: '1px 3px',
                whiteSpace: 'nowrap',
              }}>
                {b.label}
              </span>
            </button>
          );
        })}

        {/* Character */}
        <div
          style={{
            position: 'absolute',
            left: charPos.x,
            top: charPos.y,
            width: 32, height: 32,
            transition: 'left 300ms steps(8), top 300ms steps(8)',
            pointerEvents: 'none',
            fontSize: 28,
            lineHeight: '32px',
            textAlign: 'center',
            filter: 'drop-shadow(2px 2px 0 var(--ink))',
          }}
        >
          {/* Placeholder character — swap with <img src="/town/character.png" /> later */}
          🧍
        </div>
      </div>

      {/* Task modal */}
      {openTask && (
        <BuildingModal
          building={openTask}
          log={log}
          onUpdate={update}
          onClose={() => setOpenTask(null)}
        />
      )}

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, opacity: 0.7 }}>
        Tap a building to log it. Tap anywhere to wander.
      </div>
    </>
  );
}
```

### 3. Build the BuildingModal component

Create `src/components/BuildingModal.jsx`:

```jsx
import { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/days';
import { pixelate } from '../lib/photo';
import { sfx } from '../lib/sfx';
import PixelButton from './PixelButton';

export default function BuildingModal({ building, log, onUpdate, onClose }) {
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
        maxWidth: 360, width: '100%',
        boxShadow: '6px 6px 0 rgba(45,45,68,0.5)',
      }}>
        <h2 style={{ marginBottom: 16, textAlign: 'center' }}>
          {building.emoji} {building.label}
        </h2>

        <TaskInput task={building.task} log={log} onUpdate={onUpdate} />

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <PixelButton onClick={onClose}>LEAVE</PixelButton>
        </div>
      </div>
    </div>
  );
}

function TaskInput({ task, log, onUpdate }) {
  const { session } = useAuth();
  const fileInputRef = useRef(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    if (task === 'photo' && log.photo_url) {
      supabase.storage
        .from('progress-photos')
        .createSignedUrl(log.photo_url, 3600)
        .then(({ data }) => setPhotoUrl(data?.signedUrl));
    }
  }, [task, log.photo_url]);

  if (task === 'gym') {
    return (
      <BigToggle
        label="Did Workout 1 (45 min)?"
        checked={log.workout_1}
        onChange={v => onUpdate({ workout_1: v })}
      />
    );
  }
  if (task === 'outdoor') {
    return (
      <BigToggle
        label="Did outdoor workout (45 min)?"
        checked={log.workout_2_outdoor}
        onChange={v => onUpdate({ workout_2_outdoor: v })}
      />
    );
  }
  if (task === 'diet') {
    return (
      <BigToggle
        label="Stayed on diet?"
        checked={log.diet}
        onChange={v => onUpdate({ diet: v })}
      />
    );
  }
  if (task === 'alcohol') {
    return (
      <>
        <p style={{ marginBottom: 12 }}>
          The tavern is closed for the next 75 days. Did you drink?
        </p>
        <BigToggle
          label="I DRANK (breaks the run)"
          checked={!log.no_alcohol}
          onChange={v => onUpdate({ no_alcohol: !v })}
          dangerous
        />
      </>
    );
  }
  if (task === 'reading') {
    return (
      <>
        <p style={{ marginBottom: 8 }}>How many pages did you read today?</p>
        <input
          type="number" min={0}
          className="nes-input"
          value={log.reading_pages}
          onChange={e => onUpdate({ reading_pages: parseInt(e.target.value) || 0 })}
          style={{ fontFamily: 'VT323, monospace', fontSize: 24 }}
        />
        <p style={{ marginTop: 8, fontSize: 16, opacity: 0.7 }}>Goal: 10+</p>
      </>
    );
  }
  if (task === 'water') {
    return (
      <>
        <p style={{ marginBottom: 12 }}>Fill a flask (3 needed):</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => {
                sfx.play(n <= log.water_count ? 'tap' : 'complete');
                onUpdate({ water_count: n <= log.water_count ? n - 1 : n });
              }}
              style={{
                width: 56, height: 72, fontSize: 40, lineHeight: 1,
                border: '3px solid var(--ink)',
                background: n <= log.water_count ? 'var(--mint)' : '#fff',
                cursor: 'pointer',
              }}
            >
              {n <= log.water_count ? '💧' : '·'}
            </button>
          ))}
        </div>
      </>
    );
  }
  if (task === 'sleep') {
    return (
      <>
        <p style={{ marginBottom: 8 }}>How many hours did you sleep last night?</p>
        <input
          type="number" step="0.5" min={0}
          className="nes-input"
          value={log.sleep_hours}
          onChange={e => onUpdate({ sleep_hours: parseFloat(e.target.value) || 0 })}
          style={{ fontFamily: 'VT323, monospace', fontSize: 24 }}
        />
        <p style={{ marginTop: 8, fontSize: 16, opacity: 0.7 }}>Goal: 8+</p>
      </>
    );
  }
  if (task === 'photo') {
    async function handleFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      sfx.play('complete');
      const pixelated = await pixelate(file, 96);
      const path = `${session.user.id}/${todayISO()}.jpg`;
      const { error } = await supabase.storage
        .from('progress-photos')
        .upload(path, pixelated, { upsert: true, contentType: 'image/jpeg' });
      if (error) { console.error(error); return; }
      onUpdate({ photo_url: path });
    }
    return (
      <>
        {photoUrl ? (
          <img src={photoUrl} alt="" className="pixelated"
               style={{ width: 192, height: 192, display: 'block', margin: '0 auto 12px' }} />
        ) : (
          <p style={{ marginBottom: 12 }}>No photo yet.</p>
        )}
        <input
          ref={fileInputRef}
          type="file" accept="image/*" capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <div style={{ textAlign: 'center' }}>
          <PixelButton onClick={() => fileInputRef.current?.click()}>
            {log.photo_url ? 'RETAKE' : 'TAKE PHOTO'}
          </PixelButton>
        </div>
      </>
    );
  }
  return null;
}

function BigToggle({ label, checked, onChange, dangerous }) {
  return (
    <button
      onClick={() => {
        sfx.play(checked ? 'tap' : 'complete');
        onChange(!checked);
      }}
      style={{
        width: '100%',
        padding: 20,
        fontSize: 18,
        fontFamily: "'Press Start 2P', monospace",
        background: checked
          ? (dangerous ? 'var(--coral)' : 'var(--mint)')
          : '#fff',
        border: '3px solid var(--ink)',
        boxShadow: '4px 4px 0 var(--shadow)',
        cursor: 'pointer',
      }}
    >
      {checked ? '✓ ' : ''}{label}
    </button>
  );
}
```

### 4. Smoke test

1. Reload `/` — should see a green map with 8 emoji-buildings positioned around it
2. The 🧍 character is in the middle
3. Tap an empty grass spot → character glides to it (no other effect)
4. Tap a building (e.g. Library) → character walks to it → modal opens
5. Enter pages (e.g. 12) → close modal → reload Library → should still show 12
6. After 10+ pages saved, Library sprite should now be on mint background (lit up)
7. Complete all 8 buildings → confetti fires + day_done sound + DAY COMPLETE banner... 
   wait, we removed the banner. Should we add it back?

Add at the bottom of the map div (after BUILDINGS map, before character):

```jsx
{log.all_complete && (
  <div style={{
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'var(--mint)', border: '4px solid var(--ink)',
    padding: '16px 24px',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 14,
    boxShadow: '4px 4px 0 var(--shadow)',
    pointerEvents: 'none',
  }}>
    DAY COMPLETE!
  </div>
)}
```

---

## DONE WHEN

- [ ] Town map renders with 8 buildings positioned around a green field
- [ ] Character (🧍 placeholder is fine) starts in the middle
- [ ] Tapping empty grass moves the character to that spot with a 300ms transition
- [ ] Tapping a building walks the character there, then opens the modal
- [ ] Each modal shows the right input for that task (toggle, number, water counter, photo)
- [ ] Saving from the modal persists to Supabase (verify via Quest Log or refresh)
- [ ] Completed buildings show on mint background (visually "lit")
- [ ] Tavern is dimmed (low opacity) when `no_alcohol = true` and lit when broken
- [ ] All 8 complete → confetti + day_done.wav + "DAY COMPLETE!" overlay
- [ ] Works on iPhone — tap targets are big enough, no scroll weirdness

---

## GOTCHAS

- **`event.stopPropagation()` on building taps** is critical — otherwise the map's onClick fires too and moves the character to where you tapped (which fights the "walk to building" animation).
- **The CSS `transition: ... steps(8)`** gives the character a jerky 8-step animation, which feels more Pokemon than smooth. If you want smooth, use `ease-out` instead.
- **Character position is component state, not persisted.** Refreshing puts them back in the middle. That's fine — they walk around again. If you ever want it persistent, save to localStorage.
- **Building label collision:** with all 8 buildings labeled, the 7px Press Start 2P labels might overlap. If so, hide labels and show them only on hover/long-press, or move buildings further apart.
- **Tavern is "complete" by default** because `no_alcohol` starts at true. This is intentional — the player passes that test by NOT visiting it. Tapping Tavern is a confession that they drank.
- **Photo modal opens but camera doesn't fire on iOS** — `<input type="file" capture>` requires the click to be a direct user gesture. Triggering it from inside a modal that JUST opened might fail. If broken, refactor to render the file input inside the modal and have the user tap it directly (current implementation does this — should work).

---

## NEXT

`build/05-friends-screen.md` — unchanged. The Party grid still works the same; the town map only replaces the Today screen.
