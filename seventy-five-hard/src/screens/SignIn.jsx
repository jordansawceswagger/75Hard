import { useState } from 'react';
import { supabase } from '../lib/supabase';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  }

  return (
    <PixelCard title="LOGIN">
      {status === 'sent' ? (
        <>
          <p>Check your email for a link.</p>
          <p style={{ marginTop: 12, fontSize: 16, opacity: 0.7 }}>
            (it may take ~30 seconds)
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ marginBottom: 12 }}>Enter your email:</p>
          <input
            type="email"
            required
            className="nes-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
            style={{ fontFamily: 'VT323, monospace', fontSize: 20 }}
          />
          <div style={{ marginTop: 16 }}>
            <PixelButton variant="primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING...' : 'SEND LINK'}
            </PixelButton>
          </div>
          {status === 'error' && (
            <p style={{ color: 'var(--coral)', marginTop: 12 }}>{error}</p>
          )}
        </form>
      )}
    </PixelCard>
  );
}
