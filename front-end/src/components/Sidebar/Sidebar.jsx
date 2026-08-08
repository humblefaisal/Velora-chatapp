import UserProfile from './UserProfile';
import RoomNav from './RoomNav';
import './Sidebar.css';

export default function Sidebar({ user, connected, online, groups, active, selectGroup, onOpenSearch, onOpenCreate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark">V</span>
          <span>velora</span>
        </div>
        <div className="action-buttons">
          <button
            className="icon-button"
            type="button"
            onClick={onOpenSearch}
            title="Search & Discover Rooms"
          >
            🔍
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={onOpenCreate}
            title="Create Room"
          >
            ＋
          </button>
        </div>
      </div>

      <UserProfile user={user} connected={connected} onlineCount={online.length} />

      <p className="section-label">YOUR SPACES</p>
      <RoomNav groups={groups} active={active} selectGroup={selectGroup} />
      <div className="sidebar-foot">Thoughtful chat, no noise.</div>
    </aside>
  );
}
