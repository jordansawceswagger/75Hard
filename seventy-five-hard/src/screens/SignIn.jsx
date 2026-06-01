import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PixelCard from '../components/PixelCard';
import PixelButton from '../components/PixelButton';

const RESEND_COOLDOWN = 30; // seconds

export default function SignIn() {
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Tick the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Send (or resend) the 6-digit code. No redirect — the email's {{.Token}}
  // shows the code so it works inside the iPhone PWA (no Safari hop).
  async function sendCode() {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined, // explicitly disable the magic-link redirect
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return false;
    }
    setCooldown(RESEND_COOLDOWN);
    return true;
  }

  async function handleSendCode(e) {
    e.preventDefault();
    if (!email) return;
    if (await sendCode()) setStep('code');
  }

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setBusy(false);
    if (error) setError(error.message);
    // On success the session is set; AuthProvider's onAuthStateChange picks it
    // up and the protected-route logic routes to onboarding or /.
  }

  async function handleResend() {
    if (cooldown > 0 || busy) return;
    setCode('');
    await sendCode();
  }

  function backToEmail() {
    setStep('email');
    setCode('');
    setError('');
    setCooldown(0);
  }

  return (
    <PixelCard title="LOGIN">
      {step === 'code' ? (
        <form onSubmit={handleVerify}>
          <p style={{ marginBottom: 12 }}>Enter the 6-digit code from your email.</p>
          <input
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            className="nes-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={busy}
            style={{
              fontFamily: 'VT323, monospace',
              fontSize: 28,
              letterSpacing: 8,
              textAlign: 'center',
            }}
          />
          <div style={{ marginTop: 16 }}>
            <PixelButton variant="primary" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'VERIFYING...' : 'VERIFY'}
            </PixelButton>
          </div>
          {error && <p style={{ color: 'var(--coral)', marginTop: 12 }}>{error}</p>}
          <div style={{ marginTop: 16, fontSize: 16 }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || busy}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: cooldown > 0 || busy ? 'default' : 'pointer',
                color: cooldown > 0 || busy ? 'var(--shadow)' : 'var(--ink)',
                textDecoration: cooldown > 0 || busy ? 'none' : 'underline',
                fontFamily: 'VT323, monospace',
                fontSize: 16,
              }}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 16, opacity: 0.7 }}>
            <button
              type="button"
              onClick={backToEmail}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'var(--ink)',
                textDecoration: 'underline',
                fontFamily: 'VT323, monospace',
                fontSize: 16,
              }}
            >
              ← use a different email
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSendCode}>
          <p style={{ marginBottom: 12 }}>Enter your email:</p>
          <input
            type="email"
            required
            className="nes-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            style={{ fontFamily: 'VT323, monospace', fontSize: 20 }}
          />
          <div style={{ marginTop: 16 }}>
            <PixelButton variant="primary" type="submit" disabled={busy}>
              {busy ? 'SENDING...' : 'SEND CODE'}
            </PixelButton>
          </div>
          {error && <p style={{ color: 'var(--coral)', marginTop: 12 }}>{error}</p>}
        </form>
      )}
    </PixelCard>
  );
}
