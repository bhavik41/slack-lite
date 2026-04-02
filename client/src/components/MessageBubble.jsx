import React, { useState } from 'react';
import { formatMessageText } from '../utils/format.jsx';

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `avatar-color-${Math.abs(hash) % 8}`;
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MessageBubble({
  message,
  isContinuation,
  userId,
  onReact,
  onClickUser,
  onEdit,
  onDelete,
  onOpenThread,
  isThreadView = false,
}) {
  const { senderUsername, content, createdAt, reactions = [], files = [], isEdited, replyCount = 0 } = message;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);

  // Group reactions by emoji
  const reactionGroups = {};
  for (const r of reactions) {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { emoji: r.emoji, users: [], mine: false };
    reactionGroups[r.emoji].users.push(r.username);
    if (r.userId === userId) reactionGroups[r.emoji].mine = true;
  }

  const quickEmojis = ['👍', '👀', '🎉', '❤️'];
  const isOwner = message.senderId === userId;

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEdit) onEdit(message._id, editText);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this message?')) {
      if (onDelete) onDelete(message._id);
    }
  };

  // Helper to render files
  const renderFiles = () => {
    if (!files || files.length === 0) return null;
    return (
      <div className="message-files">
        {files.map((file, idx) => {
          const isImage = file.fileType.startsWith('image/');
          return (
            <div key={idx} className="message-file-attachment">
              {isImage ? (
                <div className="message-file-image-wrapper">
                  <img
                    src={`http://localhost:4000${file.url}`}
                    alt={file.name}
                    className="message-file-img"
                    style={{ maxHeight: '200px', borderRadius: '4px', marginTop: '4px' }}
                  />
                  <div className="message-file-name-overlay">{file.name}</div>
                </div>
              ) : (
                <a
                  href={`http://localhost:4000${file.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-file-doc"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', textDecoration: 'none', color: '#1264a3', fontWeight: '500', fontSize: '13px', marginTop: '4px' }}
                >
                  📎 {file.name}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Helper to render actions overlay
  const renderActions = () => (
    <div className="message__actions">
      {quickEmojis.map((e) => (
        <button key={e} className="message__action-btn" onClick={() => onReact(message._id, e)}>{e}</button>
      ))}
      {!isThreadView && !message.parentMessageId && (
        <button
          className="message__action-btn"
          title="Reply in thread"
          onClick={() => onOpenThread && onOpenThread(message)}
        >
          💬
        </button>
      )}
      {isOwner && (
        <>
          <button className="message__action-btn" title="Edit" onClick={() => { setIsEditing(true); setEditText(content); }}>✏️</button>
          <button className="message__action-btn" title="Delete" onClick={handleDelete}>🗑️</button>
        </>
      )}
    </div>
  );

  if (isEditing) {
    return (
      <div className={`message ${isContinuation ? 'continuation' : ''}`}>
        {!isContinuation && (
          <div className={`message__avatar ${avatarColor(senderUsername)}`}>
            {senderUsername.charAt(0)}
          </div>
        )}
        <div className="message__body" style={{ width: '100%' }}>
          {!isContinuation && (
            <div className="message__header">
              <span className="message__sender">{senderUsername}</span>
              <span className="message__time">{formatTime(createdAt)}</span>
            </div>
          )}
          <div className="message-edit-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <textarea
              className="message-edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
            />
            <div className="message-edit-actions" style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-save" onClick={handleSaveEdit} style={{ padding: '4px 8px', backgroundColor: '#007a5a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
              <button className="btn btn-cancel" onClick={() => setIsEditing(false)} style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isContinuation) {
    return (
      <div className="message continuation">
        <span className="message__continuation-time">{formatTime(createdAt)}</span>
        <div className="message__body">
          <div className="message__content">
            {formatMessageText(content, onClickUser)}
            {isEdited && <span className="message__edited-tag" style={{ fontSize: '10px', color: '#868686', marginLeft: '4px' }}>(edited)</span>}
          </div>
          {renderFiles()}
          {Object.keys(reactionGroups).length > 0 && (
            <div className="message__reactions">
              {Object.values(reactionGroups).map((g) => (
                <button
                  key={g.emoji}
                  className={`reaction-chip ${g.mine ? 'mine' : ''}`}
                  onClick={() => onReact(message._id, g.emoji)}
                  title={g.users.join(', ')}
                >
                  <span>{g.emoji}</span>
                  <span className="reaction-chip__count">{g.users.length}</span>
                </button>
              ))}
            </div>
          )}
          {!isThreadView && replyCount > 0 && (
            <div className="message__thread-replies-link" onClick={() => onOpenThread && onOpenThread(message)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1264a3', fontWeight: 'bold', marginTop: '6px' }}>
              <span>💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
            </div>
          )}
        </div>
        {renderActions()}
      </div>
    );
  }

  return (
    <div className="message">
      <div
        className={`message__avatar ${avatarColor(senderUsername)}`}
        onClick={() => onClickUser?.(senderUsername)}
        style={{ cursor: 'pointer' }}
      >
        {senderUsername.charAt(0)}
      </div>
      <div className="message__body">
        <div className="message__header">
          <span
            className="message__sender"
            onClick={() => onClickUser?.(senderUsername)}
          >
            {senderUsername}
          </span>
          <span className="message__time">{formatTime(createdAt)}</span>
        </div>
        <div className="message__content">
          {formatMessageText(content, onClickUser)}
          {isEdited && <span className="message__edited-tag" style={{ fontSize: '10px', color: '#868686', marginLeft: '4px' }}>(edited)</span>}
        </div>
        {renderFiles()}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="message__reactions">
            {Object.values(reactionGroups).map((g) => (
              <button
                key={g.emoji}
                className={`reaction-chip ${g.mine ? 'mine' : ''}`}
                onClick={() => onReact(message._id, g.emoji)}
                title={g.users.join(', ')}
              >
                <span>{g.emoji}</span>
                <span className="reaction-chip__count">{g.users.length}</span>
              </button>
            ))}
          </div>
        )}
        {!isThreadView && replyCount > 0 && (
          <div className="message__thread-replies-link" onClick={() => onOpenThread && onOpenThread(message)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1264a3', fontWeight: 'bold', marginTop: '6px' }}>
            <span>💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}
      </div>
      {renderActions()}
    </div>
  );
}
