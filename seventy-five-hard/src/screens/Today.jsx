import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { daysSince, todayISO } from '../lib/days';
import { sfx } from '../lib/sfx';
import { toast } from '../lib/toast';
import {
  GRID, TILE, WORLD, TILES, BUILDINGS, COTTAGES, START_CELL,
  isWalkable, findPath,
} from '../lib/townMap';
import { tavernUrl } from '../lib/species';
import PixelConfetti from '../components/PixelConfetti';
import TownCharacter from '../components/TownCharacter';
import BuildingModal from '../components/BuildingModal';

const STEP_MS = 130; // ms per tile of walking

const EMPTY_LOG = {
  workout_1: false, workout_2_outdoor: false, diet: false,
  reading_pages: 0, water_count: 0, photo_taken: false,
  no_alcohol: true, sleep_hours: 0,
};

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

// Camera offset (px) that keeps the character centred, clamped to the world.
function getCam(cell, vw) {
  const cx = cell.col * TILE + TILE / 2;
  const cy = cell.row * TILE + TILE / 2;
  const max = Math.max(0, WORLD - vw);
  const clamp = v => Math.max(0, Math.min(v, max));
  return { camX: clamp(cx - vw / 2), camY: clamp(cy - vw / 2) };
}

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
  const [isWalking, setIsWalking] = useState(false);
  const walkingRef = useRef(false);
  const timerRef = useRef(null);

  // Camera viewport size (px)
  const viewportRef = useRef(null);
  const [vw, setVw] = useState(480);

  useEffect(() => {
    const measure = () => {
      if (viewportRef.current) setVw(viewportRef.current.clientWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Load today's log
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

  useEffect(() => {
    if (log.all_complete && !wasComplete.current) {
      sfx.play('day_done');
      setConfetti(c => c + 1);
      wasComplete.current = true;
    }
  }, [log.all_complete]);

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

  function walkTo(goal, onArrive) {
    if (walkingRef.current) return;
    const path = findPath(charCell, goal);
    if (!path.length) { onArrive?.(); return; }
    walkingRef.current = true;
    setIsWalking(true);
    sfx.play('tap');
    let i = 0;
    const step = () => {
      if (i >= path.length) {
        walkingRef.current = false;
        setIsWalking(false);
        onArrive?.();
        return;
      }
      setCharCell(path[i]);
      i++;
      timerRef.current = setTimeout(step, STEP_MS);
    };
    step();
  }

  function handleBuildingTap(b) {
    walkTo(b.approach, () => setOpenTask(b));
  }

  function handleMapTap(e) {
    if (!viewportRef.current || walkingRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const { camX, camY } = getCam(charCell, rect.width);
    const col = Math.floor((e.clientX - rect.left + camX) / TILE);
    const row = Math.floor((e.clientY - rect.top + camY) / TILE);
    if (isWalkable(col, row)) walkTo({ col, row });
  }

  if (loading) return <p>Loading...</p>;

  const { camX, camY } = getCam(charCell, vw);

  return (
    <>
      <PixelConfetti trigger={confetti} />
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <h1 className={log.all_complete ? 'day-complete-pulse' : undefined}>DAY {dayNumber} / 75</h1>
      </div>

      {/* Camera viewport (fixed window into the larger world) */}
      <div
        ref={viewportRef}
        onClick={handleMapTap}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: WORLD,
          aspectRatio: '1 / 1',
          margin: '0 auto',
          border: '4px solid var(--ink)',
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#A8D88A',
        }}
      >
        {/* World layer — panned by the camera */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: WORLD, height: WORLD,
          transform: `translate(${-camX}px, ${-camY}px)`,
          transition: `transform ${STEP_MS}ms linear`,
        }}>
          {/* Tiles */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID}, ${TILE}px)`,
            gridTemplateRows: `repeat(${GRID}, ${TILE}px)`,
          }}>
            {TILES.flatMap((rowArr, r) => rowArr.map((t, c) => {
              let style;
              if (t === 'W') {
                // River — impassable water
                style = { background: '#5BC0DE' };
              } else if (t === 'B') {
                // Bridge — wooden planks with dark rails top & bottom
                style = {
                  background: 'repeating-linear-gradient(90deg,#A56A2C 0 8px,#B98341 8px 11px)',
                  boxShadow: 'inset 0 4px 0 #6F4218, inset 0 -4px 0 #6F4218',
                };
              } else {
                style = {
                  backgroundImage: `url(/town/${t === 'P' ? 'path' : 'grass'}.png)`,
                  backgroundSize: '100% 100%',
                };
              }
              return <div key={`${c},${r}`} style={{ ...style, imageRendering: 'pixelated' }} />;
            }))}
          </div>

          {/* Cottages (decorative scenery, non-interactive) */}
          {COTTAGES.map((c, i) => (
            <img
              key={`cottage${i}`}
              src="/town/cottage.png"
              alt=""
              className="pixelated"
              style={{
                position: 'absolute',
                left: c.col * TILE, top: c.row * TILE,
                width: TILE, height: TILE,
                pointerEvents: 'none', zIndex: 3,
              }}
            />
          ))}

          {/* Buildings */}
          {BUILDINGS.map(b => {
            const done = taskComplete[b.task](log);
            return (
              <button
                key={b.id}
                onClick={(e) => { e.stopPropagation(); handleBuildingTap(b); }}
                style={{
                  position: 'absolute',
                  left: b.col * TILE, top: b.row * TILE,
                  width: TILE, height: TILE,
                  padding: 0, border: 'none', background: 'transparent',
                  cursor: 'pointer', zIndex: 4,
                }}
              >
                <img
                  src={
                    b.id === 'tavern' ? tavernUrl(dayNumber)
                    : b.id === 'photo' ? '/town/photo-studio.png'
                    : `/town/${b.id}.png`
                  }
                  alt={b.label}
                  className={done ? 'pixelated building-done' : 'pixelated'}
                  style={{
                    width: '100%', height: '100%', display: 'block',
                    opacity: b.task === 'alcohol' && !done ? 0.45 : 1,
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

          {/* Character */}
          <TownCharacter
            species={profile?.species}
            day={dayNumber}
            leftPx={charCell.col * TILE}
            topPx={charCell.row * TILE}
            sizePx={TILE}
            stepMs={STEP_MS}
            idle={!isWalking}
          />
        </div>

        {/* DAY COMPLETE banner — fixed in the viewport, always visible */}
        {log.all_complete && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--mint)', border: '4px solid var(--ink)',
            padding: '16px 24px',
            fontFamily: "'Press Start 2P', monospace", fontSize: 14,
            boxShadow: '4px 4px 0 var(--shadow)',
            pointerEvents: 'none', zIndex: 10,
          }}>
            DAY COMPLETE!
          </div>
        )}
      </div>

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
