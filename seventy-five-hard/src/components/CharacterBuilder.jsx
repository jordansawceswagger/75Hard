import { useState } from 'react';
import { TRAITS, DEFAULT_CONFIG, randomize } from '../lib/character';
import { sfx } from '../lib/sfx';
import Avatar from './Avatar';
import PixelButton from './PixelButton';

const TRAIT_ORDER = ['skinColor', 'hair', 'hairColor', 'eyes', 'eyesColor', 'mouth', 'accessories'];
const TRAIT_LABELS = {
  skinColor: 'SKIN',
  hair: 'HAIR',
  hairColor: 'HAIR COLOR',
  eyes: 'EYES',
  eyesColor: 'EYE COLOR',
  mouth: 'MOUTH',
  accessories: 'EXTRA',
};

export default function CharacterBuilder({ value, onChange, onConfirm, confirmLabel = 'KEEP →' }) {
  const config = value || DEFAULT_CONFIG;
  const [activeTab, setActiveTab] = useState(TRAIT_ORDER[0]);

  function setTrait(key, val) {
    sfx.play('tap');
    onChange({ ...config, [key]: val });
  }

  function reroll() {
    sfx.play('complete');
    onChange(randomize(config));
  }

  const tabOptions = TRAITS[activeTab];
  const isColorTab = activeTab.toLowerCase().includes('color');

  return (
    <div>
      {/* Preview */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Avatar config={config} size={128} />
      </div>

      {/* Trait tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        marginBottom: 12,
      }}>
        {TRAIT_ORDER.map(key => (
          <button
            key={key}
            onClick={() => { sfx.play('tap'); setActiveTab(key); }}
            style={{
              padding: '8px 4px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              border: '2px solid var(--ink)',
              background: activeTab === key ? 'var(--peach)' : '#fff',
              cursor: 'pointer',
            }}
          >
            {TRAIT_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Trait options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        marginBottom: 16,
      }}>
        {tabOptions.map(opt => {
          const isActive = config[activeTab] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTrait(activeTab, opt.value)}
              style={{
                padding: 8,
                fontFamily: 'VT323, monospace',
                fontSize: 14,
                border: `3px solid ${isActive ? 'var(--peach)' : 'var(--ink)'}`,
                background: isColorTab ? `#${opt.value}` : '#fff',
                color: isColorTab && isDarkHex(opt.value) ? '#fff' : 'var(--ink)',
                boxShadow: isActive ? '2px 2px 0 var(--shadow)' : 'none',
                cursor: 'pointer',
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isColorTab ? '' : opt.label}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <PixelButton onClick={reroll}>SURPRISE ME</PixelButton>
        {onConfirm && <PixelButton variant="success" onClick={onConfirm}>{confirmLabel}</PixelButton>}
      </div>
    </div>
  );
}

function isDarkHex(hex) {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
