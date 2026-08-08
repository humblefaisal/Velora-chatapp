import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

export default function MessageList({ messages, currentUser, apiUrl }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="messages">
      {!messages.length ? (
        <div className="empty">
          <h3>Start the conversation</h3>
          <p>Say hello and make this space yours.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem
            key={message.id || Math.random()}
            message={message}
            isMine={message.user === currentUser}
            apiUrl={apiUrl}
          />
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}
