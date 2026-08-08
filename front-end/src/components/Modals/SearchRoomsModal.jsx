import { useState } from 'react';

export default function SearchRoomsModal({ onClose, onSearch, results, onSelectGroup }) {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card search-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Search & Discover Spaces</h3>
        <input
          className="search-input"
          value={query}
          onChange={handleChange}
          placeholder="Search rooms by name or keyword..."
          autoFocus
        />

        <div className="search-results">
          {!results.length ? (
            <p className="muted text-center">No rooms found matching your search.</p>
          ) : (
            results.map((res) => (
              <div key={res.id} className="search-result-item">
                <div>
                  <strong>
                    {res.isPrivate ? '🔒 ' : '#'}
                    {res.name}
                  </strong>
                  {res.description && <p className="result-desc">{res.description}</p>}
                </div>
                <button
                  type="button"
                  className="primary small"
                  onClick={() => onSelectGroup(res)}
                >
                  {res.isMember ? 'Open' : 'Join'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
