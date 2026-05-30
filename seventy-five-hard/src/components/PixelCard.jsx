export default function PixelCard({ title, children, dark = false }) {
  const cls = `nes-container ${dark ? 'is-dark' : ''} ${title ? 'with-title' : ''}`;
  return (
    <div className={cls} style={{ marginBottom: 16 }}>
      {title && <p className="title" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 12 }}>{title}</p>}
      {children}
    </div>
  );
}
