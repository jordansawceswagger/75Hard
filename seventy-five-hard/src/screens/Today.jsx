import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { daysSince, todayISO } from '../lib/days';
import { sfx } from '../lib/sfx';
import { toast } from '../lib/toast';
import { GRID, TILES, BUILDINGS, START_CELL, isWalkable, findPath, dirBetween } from '../lib/townMap';
import PixelConfetti from '../components/PixelConfetti';
import TownCharacter from '../components/TownCharacter';
import BuildingModal from '../components/BuildingModal';

const STEP_MS = 130;      // ms per tile of walking
const CELL = 100 / GRID;  // one tile as a % of the map

const EMPTY_LOG = {
  workout_1: false, workout_2_outdoor: false, diet: false,
  reading_pages: 0, water_count: 0, photo_taken: false,
  no_alcohol: true, sleep_hours: 0,
};

// Map task slug -> which log field shows "complete" for that building
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
  const [openTask, setOpenTask] = useState(null);
  const wasComplete = useRef(false);
  const dayNumber = profile ? daysSince(profile.start_date) : 1;

  // Character walk state
  const [charCell, setCharCell] = useState(START_CELL);
  const [dir, setDir] = useState('down');
  const [frame, setFrame] = useState(0);
  const walkingRef = useRef(false);
  const timerRef = useRef(null);
  const mapRef = useRef(null);

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

  // Watch for first all-complete -> confetti
  useEffect(() => {
    if (log.all_complete && !wasComplete.current) {
      sfx.play('day_done');
      setConfetti(c => c + 1);
      wasComplete.current = true;
    }
  }, [log.all_complete]);

  // Clear any pending walk timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function update(patch) {
    const next = { ...log, ...patch };
    setLog(next);
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
    if (error) {
      console.error('Save failed:', error.message);
      toast.error('Save failed — not synced');
      return;
    }
    if (data) setLog(data);
  }

  // Walk the character cell-by-cell along the computed route, then onArrive().
  function walkTo(goal, onArrive) {
    if (walkingRef.current) return; // one walk at a time
    const path = findPath(charCell, goal);
    if (!path.length) { onArrive?.(); return; }
    walkingRef.current = true;
    sfx.play('tap');
    let i = 0;
    let prev = charCell;
    const step = () => {
      if (i >= path.length) {
        walkingRef.current = false;
        setFrame(0);
        onArrive?.();
        return;
      }
      const next = path[i];
      setDir(dirBetween(prev, next));
      setFrame(f => (f === 0 ? 1 : 0));
      setCharCell(next);
      prev = next;
      i++;
      timerRef.current = setTimeout(step, STEP_MS);
    };
    step();
  }

  function handleBuildingTap(b) {
    walkTo(b.approach, () => {
      setDir(dirBetween(b.approach, b)); // face the building
      setOpenTask(b);
    });
  }

  function handleMapTap(e) {
    if (!mapRef.current || walkingRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / rect.width * GRID);
    const row = Math.floor((e.clientY - rect.top) / rect.height * GRID);
    if (isWalkable(col, row)) walkTo({ col, row });
  }

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <PixelConfetti trigger={confetti} />
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1>DAY {dayNumber} / 75</h1>
      </div>

      <div
        ref={mapRef}
        onClick={handleMapTap}
        style={{
          position: 'relative',
          width: 480,
          maxWidth: '100%',
          aspectRatio: '1 / 1',
          margin: '0 auto',
          border: '4px solid var(--ink)',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        {/* Tile layer */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          gridTemplateRows: `repeat(${GRID}, 1fr)`,
        }}>
          {TILES.flatMap((rowArr, r) => rowArr.map((t, c) => (
            <div key={`${c},${r}`} style={{
              backgroundImage: `url(/town/${t === 'P' ? 'path' : 'grass'}.png)`,
              backgroundSize: '100% 100%',
              imageRendering: 'pixelated',
            }} />
          )))}
        </div>

        {/* Buildings */}
        {BUILDINGS.map(b => {
          const done = taskComplete[b.task](log);
          return (
            <button
              key={b.id}
              onClick={(e) => { e.stopPropagation(); handleBuildingTap(b); }}
              style={{
                position: 'absolute',
                left: `${b.col * CELL}%`,
                top: `${b.row * CELL}%`,
                width: `${CELL}%`,
                height: `${CELL}%`,
                padding: 0, border: 'none', background: 'transparent',
                cursor: 'pointer', zIndex: 4,
              }}
            >
              <img
                src={`/town/${b.id}.png`}
                alt={b.label}
                className="pixelated"
                style={{
                  width: '100%', height: '100%', display: 'block',
                  opacity: b.task === 'alcohol' && !done ? 0.45 : 1,
                  filter: done ? 'drop-shadow(0 0 3px var(--mint)) drop-shadow(0 0 1px var(--mint))' : 'none',
                }}
              />
              {done && (
                <span style={{
                  position: 'absolute', top: -4, right: -2, fontSize: 12,
                  textShadow: '0 0 2px #fff',
                }}>✓</span>
              )}
              <span style={{
                position: 'absolute', bottom: '100%', left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                whiteSpace: 'nowrap', color: 'var(--ink)',
                background: 'rgba(255, 244, 224, 0.85)', padding: '0 2px',
              }}>{b.label}</span>
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
            fontFamily: "'Press Start 2P', monospace", fontSize: 14,
            boxShadow: '4px 4px 0 var(--shadow)',
            pointerEvents: 'none', zIndex: 6,
          }}>
            DAY COMPLETE!
          </div>
        )}

        {/* Character */}
        <TownCharacter
          dir={dir}
          frame={frame}
          leftPct={charCell.col * CELL}
          topPct={charCell.row * CELL}
          sizePct={CELL}
          stepMs={STEP_MS}
        />
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
        Tap a building to log it. Tap a path to wander.
      </div>
    </>
  );
}
