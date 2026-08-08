import { useState } from 'react';
import './Modals.css';

export default function InviteModal({ room, onClose, onInvite }) {
  const [targetUsername, setTargetUsername] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!targetUsername.trim()) return;
    onInvite(room.id, targetUsername.trim());
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Invite to #{room.name}</h3>
        <p className="muted">Enter the username of the person you want to invite.</p>
        <form onSubmit={handleSubmit}>
          <input
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Username (e.g. alex)"
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" className="text-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
