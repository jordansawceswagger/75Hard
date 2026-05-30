import { avatarUrl, parseConfig } from '../lib/character';

// `config` is the JSON trait object stored in users.avatar_seed (or a string
// that parseConfig will JSON-parse; legacy plain seeds fall back to default).
export default function Avatar({ config, size = 64 }) {
  const cfg = parseConfig(config);
  return (
    <img
      src={avatarUrl(cfg, size)}
      alt=""
      width={size}
      height={size}
      className="pixelated"
      style={{
        background: 'var(--cream)',
        border: '3px solid var(--ink)',
        display: 'block',
        margin: '0 auto',
      }}
    />
  );
}
