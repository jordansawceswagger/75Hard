import { sfx } from '../lib/sfx';

export default function PixelButton({ children, onClick, variant = 'primary', disabled, type = 'button' }) {
  const cls = {
    primary: 'nes-btn is-primary',
    success: 'nes-btn is-success',
    warning: 'nes-btn is-warning',
    error: 'nes-btn is-error',
    default: 'nes-btn',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      className={cls}
      style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}
      onClick={(e) => {
        sfx.play('tap');
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
