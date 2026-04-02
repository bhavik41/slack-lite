import React, { useState, useEffect } from 'react';
import { formatMessageText } from '../utils/format.jsx';

export default function SearchModal({ socket, onClose, onSelectRoom }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleResults = ({ query: respQuery, results: respResults }) => {
      setResults(respResults);
      setSearching(false);
    };

    socket.on('message:searchResults', handleResults);

    return () => {
      socket.off('message:searchResults', handleResults);
    };
  }, [socket]);

  const handleSearchChange = (val) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    socket.emit('message:search', { query: val });
  };

  const handleResultClick = (msg) => {
    // Determine the room type and ID
    let room;
    if (msg.roomType === 'group') {
      const channelName = msg.roomId.replace('group:', '');
      room = { type: 'group', groupId: channelName };
    } else {
      // DM
      const parts = msg.roomId.replace('dm:', '').split(':');
      room = { type: 'dm', participants: parts };
    }
    onSelectRoom(room);
    onClose();
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal__header">
          <span className="search-modal__search-icon">🔍</span>
          <input
            className="search-modal__input"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search messages..."
            autoFocus
          />
          <button className="search-modal__close-btn" onClick={onClose}>Esc</button>
        </div>

        <div className="search-modal__results">
          {searching && <div className="search-modal__loading">Searching...</div>}
          {!searching && query.trim() && results.length === 0 && (
            <div className="search-modal__no-results">No messages match "{query}"</div>
          )}
          {!query.trim() && (
            <div className="search-modal__no-results">Type a search term to find messages.</div>
          )}

          {results.map((msg) => (
            <div
              key={msg._id}
              className="search-result-item"
              onClick={() => handleResultClick(msg)}
            >
              <div className="search-result-item__meta">
                <span className="search-result-item__sender">@{msg.senderUsername}</span>
                <span className="search-result-item__room">
                  in {msg.roomType === 'group' ? `#${msg.roomId.replace('group:', '')}` : 'Direct Message'}
                </span>
                <span className="search-result-item__time">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="search-result-item__body">
                {formatMessageText(msg.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
