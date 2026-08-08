import { useEffect, useState } from 'react';

export default function useSocketEvents(socket, API_URL) {
  const [connected, setConnected] = useState(false);
  const [connError, setConnError] = useState('');
  const [groups, setGroups] = useState([]);
  const [online, setOnline] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setConnError('');
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = () => {
      setConnected(false);
      setConnError('Unable to connect to backend server at ' + API_URL);
    };

    const onGroups = (data) => setGroups(Array.isArray(data) ? data : []);
    const onPresence = (data) => setOnline(Array.isArray(data?.users) ? data.users : []);
    const onMessage = (msg) => setMessages((current) => [...current, msg]);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('groups', onGroups);
    socket.on('presence', onPresence);
    socket.on('message', onMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('groups', onGroups);
      socket.off('presence', onPresence);
      socket.off('message', onMessage);
      socket.disconnect();
    };
  }, [socket, API_URL]);

  return {
    connected,
    connError,
    groups,
    setGroups,
    online,
    messages,
    setMessages,
  };
}
