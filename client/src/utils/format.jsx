import React from 'react';

export function formatMessageText(text, onClickUser) {
  if (!text) return '';

  // Match: `inline code`, *bold*, _italics_, ~strikethrough~, and @username
  const regex = /(`[^`\n]+`|\*[^*]+\*|_[^_]+_|~[^~]+~|@[a-zA-Z0-9_-]+)/g;
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~')) {
      return <del key={index}>{part.slice(1, -1)}</del>;
    }
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <span
          key={index}
          className="message-mention"
          onClick={() => onClickUser && onClickUser(username)}
          style={{
            cursor: 'pointer',
            color: '#1264a3',
            backgroundColor: '#e8f3fb',
            padding: '1px 4px',
            borderRadius: '3px',
            fontWeight: '600'
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
