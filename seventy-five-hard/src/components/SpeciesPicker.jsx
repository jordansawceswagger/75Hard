import { SPECIES } from '../lib/species';
import { sfx } from '../lib/sfx';
import PixelButton from './PixelButton';

// 2x2 grid of species cards (cub sprite + name + tag). `value` is the species id.
export default function SpeciesPicker({ value, onChange, onConfirm, confirmLabel = 'KEEP →' }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {SPECIES.map(s => {
          const selected = value === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { sfx.play('tap'); onChange(s.id); }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: 12,
                border: `3px solid ${selected ? 'var(--peach)' : 'var(--ink)'}`,
                background: selected ? 'var(--mint)' : '#fff',
                boxShadow: selected ? '3px 3px 0 var(--shadow)' : 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src={`/town/${s.id}-cub.png`}
                alt={s.label}
                className="pixelated"
                width={64}
                height={64}
                style={{ display: 'block' }}
              />
              <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>{s.label}</span>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{s.tag}</span>
            </button>
          );
        })}
      </div>
      {onConfirm && (
        <div style={{ textAlign: 'center' }}>
          <PixelButton variant="success" onClick={onConfirm} disabled={!value}>{confirmLabel}</PixelButton>
        </div>
      )}
    </div>
  );
}
