import './Chat.css';

export default function ChatHeader({ active, online }) {
  return (
    <header>
      <div>
        <p className="eyebrow">{active?.isPrivate ? 'PRIVATE ROOM' : 'PUBLIC ROOM'}</p>
        <h2>
          {active ? `${active.isPrivate ? '🔒 ' : '#'}${active.name}` : 'Choose a room'}
        </h2>
        {active?.description && <p className="room-desc">{active.description}</p>}
      </div>
      <div className="members">
        <div className="member-stack">
          {online.slice(0, 3).map((name, index) => (
            <span key={name} style={{ zIndex: 3 - index }}>
              {name[0]?.toUpperCase() || '?'}
            </span>
          ))}
        </div>
        <small>{online.length} here now</small>
      </div>
    </header>
  );
}
