export default function RoomNav({ groups, active, selectGroup }) {
  return (
    <nav className="room-nav">
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          className={`room ${active?.id === group.id ? 'selected' : ''}`}
          onClick={() => selectGroup(group)}
        >
          <span className="room-prefix">{group.isPrivate ? '🔒' : '#'}</span>
          <span className="room-name">{group.name}</span>
        </button>
      ))}
    </nav>
  );
}
