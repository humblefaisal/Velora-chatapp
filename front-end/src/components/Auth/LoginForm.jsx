import { useState } from 'react';

export default function LoginForm({ mode, setMode, onAuth, onGoogleAuth, error, setError, setInfo }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submitAuth = (event) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'signup') {
      if (!email.trim() || !username.trim() || password.length < 4) {
        setError('Please provide a valid email, username, and password (min 4 chars).');
        return;
      }
    } else if (mode === 'login') {
      if (!username.trim() || !password.trim()) {
        setError('Please enter your username/email and password.');
        return;
      }
    }

    onAuth(
      { email: email.trim(), username: username.trim(), password, mode },
      (result) => {
        if (!result.ok && !result.requiresOtp) {
          setError(result.error || 'Authentication failed.');
        }
      }
    );
  };

  const handleGoogleSignIn = () => {
    const dummyEmail = `user_${Math.floor(Math.random() * 1000)}@gmail.com`;
    const dummyName = `GoogleUser_${Math.floor(Math.random() * 999)}`;
    onGoogleAuth({ email: dummyEmail, name: dummyName, googleId: 'google-oauth-demo-id' }, (result) => {
      if (!result.ok) setError(result.error || 'Google Sign-In failed.');
    });
  };

  return (
    <>
      <form onSubmit={submitAuth}>
        {mode === 'signup' && (
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              autoFocus
            />
          </label>
        )}

        <label>
          {mode === 'signup' ? 'Username' : 'Username or Email'}
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={mode === 'signup' ? 'Choose username' : 'Enter username or email'}
            autoFocus={mode === 'login'}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 4 characters"
            type="password"
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="primary" type="submit">
          {mode === 'login' ? 'Sign in' : 'Create account & send OTP'} <span>→</span>
        </button>
      </form>

      <div className="divider"><span>OR</span></div>
      <button className="google-button" type="button" onClick={handleGoogleSignIn}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Sign in with Google
      </button>

      <button
        className="text-button"
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError('');
          setInfo('');
        }}
      >
        {mode === 'login' ? 'New here? Create an account with Email & OTP' : 'Already a member? Sign in'}
      </button>
    </>
  );
}
