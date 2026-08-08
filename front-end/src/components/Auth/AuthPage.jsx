import { useState } from 'react';
import LoginForm from './LoginForm';
import OtpForm from './OtpForm';
import './AuthPage.css';

export default function AuthPage({ onAuth, onVerifyOtp, onResendOtp, onGoogleAuth, serverConnected, serverError }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'otp'
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleAuth = (details, callback) => {
    onAuth(details, (result) => {
      callback(result);
      if (result.requiresOtp) {
        setPendingEmail(result.email || details.email);
        setMode('otp');
        setInfo(result.message || 'Check your email for the 6-digit verification code.');
      }
    });
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>velora</span>
        </div>
        <p className="eyebrow">PRIVATE CONVERSATIONS, ELEVATED</p>
        <h1>
          {mode === 'otp'
            ? 'Verify your email.'
            : mode === 'login'
            ? 'Welcome back.'
            : 'Create your space.'}
        </h1>
        <p className="muted">
          {mode === 'otp'
            ? `Enter the 6-digit code sent to ${pendingEmail}`
            : 'A calm place to connect, share, and keep every conversation in flow.'}
        </p>

        {serverError && (
          <div className="server-warning">
            <span>⚠️</span> {serverError}
          </div>
        )}

        {info && (
          <div className="info-banner">
            <span>✉️</span> {info}
          </div>
        )}

        {mode === 'otp' ? (
          <OtpForm
            pendingEmail={pendingEmail}
            onVerifyOtp={onVerifyOtp}
            onResendOtp={onResendOtp}
            setMode={setMode}
            error={error}
            setError={setError}
            setInfo={setInfo}
          />
        ) : (
          <LoginForm
            mode={mode}
            setMode={setMode}
            onAuth={handleAuth}
            onGoogleAuth={onGoogleAuth}
            error={error}
            setError={setError}
            setInfo={setInfo}
          />
        )}
      </section>
      <div className="orb orb-one" />
      <div className="orb orb-two" />
    </main>
  );
}
