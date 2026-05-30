import { useEffect, useState } from 'react';
import { toast } from '../lib/toast';

// Mount once near the app root. Shows a stack of pixel banners above the nav.
export default function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    return toast.subscribe((entry) => {
      setItems(prev => [...prev, entry]);
      setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== entry.id));
      }, 3500);
    });
  }, []);

  if (!items.length) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0,
      bottom: 'calc(88px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: '0 16px',
      zIndex: 3000,
      pointerEvents: 'none',
    }}>
      {items.map(t => (
        <div
          key={t.id}
          style={{
            maxWidth: 448, width: '100%',
            textAlign: 'center',
            padding: '12px 16px',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 10, lineHeight: 1.5,
            color: t.type === 'error' ? '#fff' : 'var(--ink)',
            background: t.type === 'error' ? 'var(--coral)'
                      : t.type === 'success' ? 'var(--mint)'
                      : 'var(--lavender)',
            border: '3px solid var(--ink)',
            boxShadow: '4px 4px 0 var(--shadow)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
