import { useState } from 'react';
import './Modals.css';

export default function CreateRoomModal({ onClose, onCreate }) {
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupPasscode, setGroupPasscode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    onCreate({
      name: groupName.trim(),
      description: groupDesc.trim(),
      isPrivate,
      passcode: groupPasscode,
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
              Room Passcode (Optional)
              <input
                type="password"
                value={groupPasscode}
                onChange={(e) => setGroupPasscode(e.target.value)}
                placeholder="Enter room passcode"
              />
            </label>
          )}

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
