import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createSocket, API_URL } from './socket';
import useSocketEvents from './hooks/useSocketEvents';
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Sidebar/Sidebar';
import ChatHeader from './components/Chat/ChatHeader';
import MessageList from './components/Chat/MessageList';
import Composer from './components/Chat/Composer';
import CreateRoomModal from './components/Modals/CreateRoomModal';
import SearchRoomsModal from './components/Modals/SearchRoomsModal';
import PasscodeModal from './components/Modals/PasscodeModal';
import './styles.css';

function App() {
  const socket = useMemo(() => createSocket(), []);
  const { connected, connError, groups, setGroups, online, messages, setMessages } =
    useSocketEvents(socket, API_URL);

  const [user, setUser] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');

  // Modals & Search state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [joiningGroup, setJoiningGroup] = useState(null);

  const selectGroup = (group, passcode = null) => {
    if (!group?.id) return;
    socket.emit('join-group', { groupId: group.id, passcode }, (result) => {
      if (!result) return setError('Failed to join room (no server response).');
      if (result.requiresPasscode) {
        setJoiningGroup(group);
        return;
      }
      if (!result.ok) return setError(result.error || 'Unable to join room.');
      setActive(result.group || group);
      setMessages(Array.isArray(result.messages) ? result.messages : []);
      setError('');
      setJoiningGroup(null);
      setShowSearchModal(false);
    });
  };

  const authenticate = (details, callback) => {
    if (!socket.connected) socket.connect();
    socket.emit('auth', details, (result) => {
      callback(result || { ok: false, error: 'Server error' });
      if (result?.ok && result.user) {
        setUser(result.user);
        const groupList = Array.isArray(result.groups) ? result.groups : [];
        setGroups(groupList);
        const initial = groupList[0];
        if (initial) selectGroup(initial);
      }
    });
  };

  const verifyOtp = (email, otp, callback) => {
    socket.emit('verify-otp', { email, otp }, (result) => {
      callback(result || { ok: false, error: 'Server error' });
      if (result?.ok && result.user) {
        setUser(result.user);
        const groupList = Array.isArray(result.groups) ? result.groups : [];
        setGroups(groupList);
        const initial = groupList[0];
        if (initial) selectGroup(initial);
      }
    });
  };

  const resendOtp = (email, callback) => {
    socket.emit('resend-otp', { email }, (result) => {
      callback(result || { ok: false, error: 'Failed to send verification code.' });
    });
  };

  const googleAuth = (details, callback) => {
    if (!socket.connected) socket.connect();
    socket.emit('google-auth', details, (result) => {
      callback(result || { ok: false, error: 'Google auth error' });
      if (result?.ok && result.user) {
        setUser(result.user);
        const groupList = Array.isArray(result.groups) ? result.groups : [];
        setGroups(groupList);
        const initial = groupList[0];
        if (initial) selectGroup(initial);
      }
    });
  };

  const handleCreateGroup = (roomData) => {
    socket.emit('create-group', roomData, (result) => {
      if (!result) return setError('Server did not respond.');
      if (!result.ok) return setError(result.error || 'Failed to create room.');
      setShowCreateModal(false);
      if (result.group) selectGroup(result.group);
    });
  };

  const handleSearch = (query) => {
    socket.emit('search-groups', { query }, (result) => {
      if (result?.ok) {
        setSearchResults(result.results || []);
      }
    });
  };

  const handleSendMessage = ({ text, file }, done) => {
    let attachment = null;
    const sendPayload = async () => {
      try {
        if (file) {
          const form = new FormData();
          form.append('file', file);
          const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: form });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || 'Upload failed.');
          }
          attachment = await res.json();
        }
        socket.emit('send-message', { text, attachment }, (result) => {
          if (!result) setError('Failed to send message.');
          else if (!result.ok) setError(result.error || 'Failed to send message.');
          else done();
        });
      } catch (err) {
        setError(err.message || 'An error occurred.');
      }
    };
    sendPayload();
  };

  if (!user) {
    return (
      <AuthPage
        onAuth={authenticate}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        onGoogleAuth={googleAuth}
        serverConnected={connected}
        serverError={connError}
      />
    );
  }

  return (
    <main className="chat-shell">
      <Sidebar
        user={user}
        connected={connected}
        online={online}
        groups={groups}
        active={active}
        selectGroup={selectGroup}
        onOpenSearch={() => {
          setShowSearchModal(true);
          handleSearch('');
        }}
        onOpenCreate={() => setShowCreateModal(true)}
      />

      <section className="conversation">
        <ChatHeader active={active} online={online} />
        <MessageList messages={messages} currentUser={user} apiUrl={API_URL} />
        {error && <p className="toast">{error}</p>}
        <Composer active={active} onSend={handleSendMessage} />
      </section>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {showSearchModal && (
        <SearchRoomsModal
          onClose={() => setShowSearchModal(false)}
          onSearch={handleSearch}
          results={searchResults}
          onSelectGroup={selectGroup}
        />
      )}

      {joiningGroup && (
        <PasscodeModal
          room={joiningGroup}
          onClose={() => setJoiningGroup(null)}
          onSubmit={(room, passcode) => selectGroup(room, passcode)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
