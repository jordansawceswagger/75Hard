import { sfx } from '../lib/sfx';

export default function PixelCheckbox({ label, checked, onChange }) {
  return (
    <label className="nes-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', cursor: 'pointer' }}>
      <input
        type="checkbox"
        className="nes-checkbox"
        checked={checked}
        onChange={(e) => {
          sfx.play(e.target.checked ? 'complete' : 'tap');
          onChange?.(e.target.checked);
        }}
      />
      <span style={{ fontSize: 22 }}>{label}</span>
    </label>
  );
}
