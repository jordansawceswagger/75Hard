import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { todayISO } from '../lib/days';
import { sfx } from '../lib/sfx';
import { DEFAULT_CONFIG, serializeConfig } from '../lib/character';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';
import CharacterBuilder from '../components/CharacterBuilder';

export default function Onboarding() {
  const { session, setProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  async function finish() {
    sfx.play('day_done');
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        display_name: name,
        avatar_seed: serializeConfig(config), // stores JSON trait config
        start_date: startDate,
      })
      .select()
      .single();
    if (error) {
      console.error(error);
      return;
    }
    setProfile(data);
    navigate('/');
  }

  if (step === 0) {
    return (
      <PixelCard title="NEW QUEST">
        <p style={{ marginBottom: 16 }}>What's your name, adventurer?</p>
        <input
          className="nes-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <p style={{ marginTop: 16, marginBottom: 8 }}>Start date:</p>
        <input
          type="date"
          className="nes-input"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ fontFamily: 'VT323, monospace', fontSize: 22 }}
        />
        <div style={{ marginTop: 20 }}>
          <PixelButton variant="primary" onClick={() => name && setStep(1)} disabled={!name}>
            NEXT →
          </PixelButton>
        </div>
      </PixelCard>
    );
  }

  if (step === 1) {
    return (
      <PixelCard title="BUILD YOUR SPRITE">
        <CharacterBuilder
          value={config}
          onChange={setConfig}
          onConfirm={() => setStep(2)}
          confirmLabel="KEEP →"
        />
      </PixelCard>
    );
  }

  // step 2: Install tutorial
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone;

  if (isStandalone) {
    // Already installed — skip to finish
    return (
      <PixelCard title="READY">
        <p>You're installed and ready to start the quest.</p>
        <p style={{ marginTop: 12 }}>Hello, {name}!</p>
        <div style={{ marginTop: 16 }}>
          <PixelButton variant="success" onClick={finish}>
            START DAY 1
          </PixelButton>
        </div>
      </PixelCard>
    );
  }

  return (
    <PixelCard title="INSTALL ON HOME SCREEN">
      <p style={{ marginBottom: 12 }}>
        For the full app experience, add this to your home screen:
      </p>
      <ol style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.8 }}>
        <li>Tap the <strong>Share</strong> button below ⤴</li>
        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>Add</strong> in the top right</li>
        <li>Open the new 75 HARD icon from your home screen</li>
      </ol>
      <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 16 }}>
        (You can also skip this and use it in Safari, but it looks better installed.)
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <PixelButton onClick={finish}>
          SKIP
        </PixelButton>
        <PixelButton variant="success" onClick={finish}>
          DONE — START!
        </PixelButton>
      </div>
    </PixelCard>
  );
}
