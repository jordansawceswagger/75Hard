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
  if (task === 'photo') {
    return (
      <>
        <p style={{ marginBottom: 12 }}>
          Took today's progress photo and sent it to the group?
        </p>
        <BigToggle
          label="Sent today's photo"
          checked={log.photo_taken}
          onChange={v => onUpdate({ photo_taken: v })}
        />
      </>
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
