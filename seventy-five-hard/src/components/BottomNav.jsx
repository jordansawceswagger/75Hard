import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'TODAY' },
  { to: '/party', label: 'PARTY' },
  { to: '/quest', label: 'QUEST' },
  { to: '/me', label: 'ME' },
];

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      maxWidth: 480, margin: '0 auto',
      display: 'flex', borderTop: '3px solid var(--ink)',
      background: 'var(--cream)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          style={({ isActive }) => ({
            flex: 1, textAlign: 'center', padding: 16,
            fontFamily: "'Press Start 2P', monospace", fontSize: 11,
            color: 'var(--ink)',
            background: isActive ? 'var(--peach)' : 'transparent',
            textDecoration: 'none',
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
