import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { sfx } from '../lib/sfx';
import { daysSince } from '../lib/days';
import { parseConfig, serializeConfig } from '../lib/character';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';
import CharacterBuilder from '../components/CharacterBuilder';

export default function Profile() {
  const { session, profile, setProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name || '');
  const [sfxOn, setSfxOn] = useState(profile?.sfx_enabled ?? true);
  const [config, setConfig] = useState(parseConfig(profile?.avatar_seed));
  const [stats, setStats] = useState({ logs: 0, completed: 0 });

  useEffect(() => {
    if (!profile) return;
    sfx.setEnabled(profile.sfx_enabled);
    supabase
      .from('daily_logs')
      .select('all_complete')
      .eq('user_id', session.user.id)
      .then(({ data }) => {
        const logs = data?.length || 0;
        const completed = data?.filter(l => l.all_complete).length || 0;
        setStats({ logs, completed });
      });
  }, [profile, session]);

  async function save() {
    sfx.play('complete');
    const { data } = await supabase
      .from('users')
      .update({ display_name: name, avatar_seed: serializeConfig(config), sfx_enabled: sfxOn })
      .eq('id', session.user.id)
      .select()
      .single();
    setProfile(data);
    sfx.setEnabled(sfxOn);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!profile) return null;
  const currentDay = daysSince(profile.start_date);

  return (
    <>
      <h1 style={{ textAlign: 'center', marginBottom: 16 }}>INVENTORY</h1>

      <PixelCard title="STATS">
        <p>Current day: <strong>{currentDay} / 75</strong></p>
        <p>Days logged: <strong>{stats.logs}</strong></p>
        <p>Days completed: <strong>{stats.completed}</strong></p>
        <p>Started: <strong>{profile.start_date}</strong></p>
      </PixelCard>

      <PixelCard title="SPRITE">
        <CharacterBuilder value={config} onChange={setConfig} />
      </PixelCard>

      <PixelCard title="SETTINGS">
        <p style={{ marginBottom: 8 }}>Display name:</p>
        <input
          className="nes-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 22 }}>
          <input
            type="checkbox"
            className="nes-checkbox"
            checked={sfxOn}
            onChange={e => setSfxOn(e.target.checked)}
          />
          <span>Sound effects</span>
        </label>
        <div style={{ marginTop: 16 }}>
          <PixelButton variant="success" onClick={save}>SAVE</PixelButton>
        </div>
      </PixelCard>

      <PixelCard>
        <p style={{ marginBottom: 12, fontSize: 14, opacity: 0.7 }}>
          Signed in as {session.user.email}
        </p>
        <PixelButton variant="error" onClick={signOut}>SIGN OUT</PixelButton>
      </PixelCard>
    </>
  );
}
