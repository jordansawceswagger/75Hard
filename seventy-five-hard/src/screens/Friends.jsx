import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { todayISO, daysSince } from '../lib/days';
import { sfx } from '../lib/sfx';
import { toast } from '../lib/toast';
import { spriteUrl } from '../lib/species';
import PixelCard from '../components/PixelCard';
import PixelProgress from '../components/PixelProgress';

const REACTIONS = ['🔥', '💗'];

export default function Friends() {
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState({});       // { user_id: log }
  const [reactions, setReactions] = useState({}); // { log_id: [reactions] }

  useEffect(() => {
    loadAll();
    // Realtime subscription for reactions (needs Replication ON for `reactions`)
    const sub = supabase
      .channel('reactions-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        loadAll();
      })
      .subscribe();
    return () => sub.unsubscribe();
  }, []);

  async function loadAll() {
    const date = todayISO();
    const [{ data: u }, { data: l }] = await Promise.all([
      supabase.from('users').select('*').order('created_at'),
      supabase.from('daily_logs').select('*').eq('log_date', date),
    ]);
    setUsers(u || []);
    const byUser = {};
    for (const log of l || []) byUser[log.user_id] = log;
    setLogs(byUser);

    const logIds = (l || []).map(x => x.id);
    if (logIds.length) {
      const { data: r } = await supabase.from('reactions').select('*').in('log_id', logIds);
      const byLog = {};
      for (const reaction of r || []) {
        if (!byLog[reaction.log_id]) byLog[reaction.log_id] = [];
        byLog[reaction.log_id].push(reaction);
      }
      setReactions(byLog);
    } else {
      setReactions({});
    }
  }

  async function react(log, emoji) {
    const existing = reactions[log.id]?.find(r => r.from_user_id === session.user.id);
    let error;
    if (existing && existing.emoji === emoji) {
      // Tapping your active reaction again removes it (toggle off).
      sfx.play('tap');
      ({ error } = await supabase.from('reactions')
        .delete()
        .eq('log_id', log.id)
        .eq('from_user_id', session.user.id));
    } else {
      // New reaction, or swap to the other emoji (upsert -> UPDATE on conflict).
      sfx.play('complete');
      ({ error } = await supabase.from('reactions').upsert({
        log_id: log.id,
        from_user_id: session.user.id,
        emoji,
      }, { onConflict: 'log_id,from_user_id' }));
    }
    if (error) {
      console.error('Reaction failed:', error.message);
      toast.error("Couldn't react");
      return;
    }
    // Refresh immediately so the UI updates even if realtime isn't enabled yet.
    loadAll();
  }

  return (
    <>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>PARTY</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {users.map(u => {
          const log = logs[u.id];
          const isAfk = !log;
          return (
            <PixelCard key={u.id}>
              <div style={{ textAlign: 'center', filter: isAfk ? 'grayscale(1)' : 'none' }}>
                <img
                  src={spriteUrl(u.species, daysSince(u.start_date))}
                  alt={u.display_name}
                  className="pixelated"
                  width={80}
                  height={80}
                  style={{ display: 'block', margin: '0 auto' }}
                />
                <div style={{ marginTop: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
                  {u.display_name}
                </div>
                <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
                  LV {daysSince(u.start_date)}
                </div>
                {isAfk ? (
                  <p style={{ marginTop: 8, fontSize: 14 }}>??? AFK</p>
                ) : (
                  <>
                    <PixelProgress log={log} />
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 12 }}>
                      {REACTIONS.map(e => {
                        const count = reactions[log.id]?.filter(r => r.emoji === e).length || 0;
                        const mine = reactions[log.id]?.some(
                          r => r.emoji === e && r.from_user_id === session.user.id
                        );
                        const isMe = u.id === session.user.id;
                        return (
                          <button
                            key={e}
                            disabled={isMe}
                            onClick={() => react(log, e)}
                            style={{
                              fontSize: 18, padding: '4px 8px',
                              border: '2px solid var(--ink)',
                              background: mine ? 'var(--peach)' : '#fff',
                              cursor: isMe ? 'default' : 'pointer',
                              opacity: isMe ? 0.5 : 1,
                            }}
                          >
                            {e} {count > 0 && <span style={{ fontSize: 12 }}>{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </PixelCard>
          );
        })}
      </div>
    </>
  );
}
