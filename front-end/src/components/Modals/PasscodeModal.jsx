import { useState } from 'react';

export default function PasscodeModal({ room, onClose, onSubmit }) {
  const [passcode, setPasscode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(room, passcode);
  };

  return (
    <div className="modal-backdrop">
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
