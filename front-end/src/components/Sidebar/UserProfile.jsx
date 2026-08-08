export default function UserProfile({ user, connected, onlineCount }) {
  return (
    <div className="profile">
      <div className="avatar">{user[0]?.toUpperCase() || '?'}</div>
      <div>
        <strong>{user}</strong>
        <small>
          <i className={connected ? 'online-dot' : 'offline-dot'} />
          {connected ? `${onlineCount} online` : 'Connecting...'}
        </small>
      </div>
    </div>
  );
}
