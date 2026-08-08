import { useState } from 'react';

export default function OtpForm({ pendingEmail, onVerifyOtp, onResendOtp, setMode, error, setError, setInfo }) {
  const [otp, setOtp] = useState('');

  const submitOtp = (event) => {
    event.preventDefault();
    setError('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    onVerifyOtp(pendingEmail, otp.trim(), (result) => {
      if (!result.ok) setError(result.error || 'Invalid OTP code.');
    });
  };

  const handleResendOtp = () => {
    setError('');
    setInfo('Sending new verification code...');
    onResendOtp(pendingEmail, (result) => {
      if (result.ok) {
        setInfo(result.message || 'A new 6-digit code has been sent to your email.');
      } else {
        setError(result.error || 'Failed to resend code.');
      }
    });
  };

  return (
    <form onSubmit={submitOtp}>
      <label>
        6-Digit Code
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="123456"
          maxLength={6}
          autoFocus
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">
        Verify Account <span>→</span>
      </button>
      <div className="otp-actions">
        <button className="text-button" type="button" onClick={handleResendOtp}>
          🔄 Resend Code
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            setInfo('');
          }}
        >
          ← Back to Sign In
        </button>
      </div>
    </form>
  );
}
