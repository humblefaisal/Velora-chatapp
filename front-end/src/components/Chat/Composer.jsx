import { useState } from 'react';

export default function Composer({ active, onSend }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!text.trim() && !file) return;
    onSend({ text, file }, () => {
      setText('');
      setFile(null);
    });
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <label className="file-button" title="Attach a file">
        <svg
          className="file-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={active ? `Message #${active.name}` : 'Choose a room first'}
        disabled={!active}
      />
      {file && <span className="file-name">{file.name}</span>}
      <button className="send" type="submit" disabled={!active}>
        Send <span>↑</span>
      </button>
    </form>
  );
}
