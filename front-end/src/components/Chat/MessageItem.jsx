import { formatTime } from '../../utils/formatters';

export default function MessageItem({ message, isMine, apiUrl }) {
  return (
    <article className={`message ${isMine ? 'mine' : ''}`}>
      <div className="message-meta">
        <strong>{message.user}</strong>
        <time>{formatTime(message.createdAt)}</time>
      </div>
      {message.text && <p>{message.text}</p>}
      {message.attachment && (
        <a
          className="attachment"
          href={`${apiUrl}${message.attachment.url}`}
          target="_blank"
          rel="noreferrer"
        >
          ↗ {message.attachment.name}
        </a>
      )}
    </article>
  );
}
