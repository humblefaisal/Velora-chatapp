import { useState } from 'react';
import './Modals.css';

export default function CreateRoomModal({ onClose, onCreate }) {
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupPasscode, setGroupPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    if (!groupName.trim()) {
      setError('Please enter a room name.');
      return;
    }
    if (isPrivate && !groupPasscode.trim()) {
      setError('A passcode is required for private rooms.');
      return;
    }
    onCreate({
      name: groupName.trim(),
      description: groupDesc.trim(),
      isPrivate,
      passcode: groupPasscode.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Create New Space</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Room Name
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. design-lounge"
              autoFocus
            />
          </label>

          <label>
            Description (Optional)
            <input
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="What is this space about?"
            />
          </label>

          <div className="toggle-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span>Make Room Private 🔒</span>
            </label>
          </div>

          {isPrivate && (
            <label>
              Room Passcode (Required)
              <input
                type="password"
                value={groupPasscode}
                onChange={(e) => setGroupPasscode(e.target.value)}
                placeholder="Enter room passcode"
              />
            </label>
          )}

          {error && <p className="error" style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

          <div className="modal-actions">
            <button type="button" className="text-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
