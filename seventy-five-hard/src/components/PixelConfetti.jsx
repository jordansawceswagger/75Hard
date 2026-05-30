import { useEffect, useState } from 'react';

const COLORS = ['#FFB5A7', '#C8B6FF', '#B8E0D2', '#FF7B7B', '#FFF4E0'];

// Renders a burst of falling pixel squares whenever `trigger` changes to a
// new truthy value. Pure CSS animation (keyframes live in index.css).
export default function PixelConfetti({ trigger }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const next = Array.from({ length: 48 }, (_, i) => ({
      id: `${trigger}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 250,
      duration: 1600 + Math.random() * 900,
      color: COLORS[i % COLORS.length],
      size: 8 + (i % 3) * 4,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 2800);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!pieces.length) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 2000 }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            border: '1px solid var(--ink)',
            imageRendering: 'pixelated',
            animation: `confetti-fall ${p.duration}ms linear ${p.delay}ms forwards`,
          }}
        />
      ))}
    </div>
  );
}
