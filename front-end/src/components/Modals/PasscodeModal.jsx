import { useState } from 'react';
import './Modals.css';

export default function PasscodeModal({ room, onClose, onSubmit }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!passcode.trim()) {
      setError('Please enter the room passcode.');
      return;
    }
    onSubmit(room, passcode, (result) => {
      if (result && !result.ok) {
        setError(result.error || 'Incorrect passcode. Please try again.');
      }
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>🔒 Passcode Required</h3>
        <p className="muted">Enter the passcode to access #{room.name}.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter room passcode"
            autoFocus
          />
          {error && <p className="error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="text-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Unlock & Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
