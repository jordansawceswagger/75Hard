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
  reading_pages: 0, water_count: 0, photo_taken: false,
  no_alcohol: true, sleep_hours: 0,
};

// Map task slug → which log field shows "complete" for that building
const taskComplete = {
  gym:     log => log.workout_1,
  outdoor: log => log.workout_2_outdoor,
  diet:    log => log.diet,
  reading: log => log.reading_pages >= 10,
  water:   log => log.water_count >= 3,
  photo:   log => log.photo_taken,
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

  // Load today's log (works with or without a profile row yet)
  useEffect(() => {
    if (!session) return;
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
  }, [session]);

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
    // Only send writable columns — never the generated all_complete or db defaults.
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        {
          user_id: session.user.id,
          log_date: todayISO(),
          day_number: dayNumber,
          workout_1: next.workout_1,
          workout_2_outdoor: next.workout_2_outdoor,
          diet: next.diet,
          reading_pages: next.reading_pages,
          water_count: next.water_count,
          photo_taken: next.photo_taken,
          no_alcohol: next.no_alcohol,
          sleep_hours: next.sleep_hours,
        },
        { onConflict: 'user_id,log_date' }
      )
      .select()
      .single();
    if (error) { console.error('Save failed:', error.message); return; }
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

        {/* DAY COMPLETE banner */}
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
