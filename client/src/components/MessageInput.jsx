import React, { useRef, useState, useEffect } from 'react';
import EmojiPicker from './EmojiPicker.jsx';

export default function MessageInput({
  draft,
  onDraftChange,
  onSend,
  placeholder,
  workspaceUsers = [],
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmoji, setShowEmoji] = useState(false);
  
  // File attachments state
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Mentions autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  function handleKeyDown(e) {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredUsers[mentionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  }

  // Handle send: includes text and files
  const handleSendClick = () => {
    const text = draft.trim();
    if (!text && attachedFiles.length === 0) return;
    if (onSend) {
      onSend(text, attachedFiles);
    }
    setAttachedFiles([]);
    onDraftChange('');
  };

  // Upload handler
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const token = localStorage.getItem('slackLite:token');
    try {
      const resp = await fetch('http://localhost:4000/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!resp.ok) throw new Error('Upload failed');
      const data = await resp.json();
      if (data.success) {
        setAttachedFiles((prev) => [...prev, ...data.files]);
      }
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  function handleEmojiSelect(emoji) {
    onDraftChange(draft + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  // Mentions logic: monitor typing for '@'
  useEffect(() => {
    const atIdx = draft.lastIndexOf('@');
    if (atIdx !== -1 && (atIdx === 0 || draft[atIdx - 1] === ' ')) {
      const textAfterAt = draft.slice(atIdx + 1);
      if (!textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(textAfterAt.toLowerCase());
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, [draft]);

  const filteredUsers = workspaceUsers.filter((u) =>
    u.username.toLowerCase().includes(mentionFilter)
  );

  const selectMention = (user) => {
    if (!user) return;
    const atIdx = draft.lastIndexOf('@');
    const prefix = draft.slice(0, atIdx);
    onDraftChange(prefix + '@' + user.username + ' ');
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Formatting insertions
  const applyFormat = (formatChar) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = draft.substring(start, end);
    const replacement = formatChar + selectedText + formatChar;
    onDraftChange(draft.substring(0, start) + replacement + draft.substring(end));
    textarea.focus();
  };

  const hasContent = draft.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="message-input-wrapper">
      {/* Mentions autocomplete overlay */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="mentions-autocomplete">
          {filteredUsers.map((user, idx) => (
            <div
              key={user.userId}
              className={`mentions-autocomplete__item ${idx === mentionIndex ? 'active' : ''}`}
              onClick={() => selectMention(user)}
            >
              <span className="mentions-autocomplete__avatar">{user.username.charAt(0)}</span>
              <span className="mentions-autocomplete__name">@{user.username}</span>
            </div>
          ))}
        </div>
      )}

      {/* Files Previews */}
      {attachedFiles.length > 0 && (
        <div className="attached-files-previews" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '8px', backgroundColor: '#f8f8f8', borderBottom: '1px solid #e2e2e2' }}>
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="attached-file-preview" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
              <span>📎 {file.name}</span>
              <button onClick={() => removeFile(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'red' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {uploading && <div style={{ fontSize: '11px', color: '#868686', padding: '4px 8px' }}>Uploading attachment...</div>}

      <div className="message-input">
        {/* Formatting toolbar */}
        <div className="message-input__toolbar">
          <button className="message-input__toolbar-btn" title="Bold" onClick={() => applyFormat('*')}>
            <strong>B</strong>
          </button>
          <button className="message-input__toolbar-btn" title="Italic" onClick={() => applyFormat('_')}>
            <em>I</em>
          </button>
          <button className="message-input__toolbar-btn" title="Strikethrough" onClick={() => applyFormat('~')}>
            <s>S</s>
          </button>
          <div className="message-input__toolbar-divider" />
          <button className="message-input__toolbar-btn" title="Inline Code" onClick={() => applyFormat('`')}>{'</>'}</button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message...'}
          rows={1}
        />

        {/* Footer with actions */}
        <div className="message-input__footer">
          <div className="message-input__footer-left">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              multiple
            />
            <button
              className="message-input__footer-btn"
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </button>
            <div style={{ position: 'relative' }}>
              <button
                className="message-input__footer-btn"
                title="Emoji"
                onClick={() => setShowEmoji(!showEmoji)}
              >
                😊
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>
            <button
              className="message-input__footer-btn"
              title="Mention"
              onClick={() => onDraftChange(draft + '@')}
            >
              @
            </button>
          </div>
          <button
            className={`message-input__send-btn ${hasContent ? 'active' : ''}`}
            onClick={handleSendClick}
            title="Send message"
            disabled={!hasContent}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
