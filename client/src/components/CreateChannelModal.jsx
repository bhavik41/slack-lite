import React, { useState } from 'react';

export default function CreateChannelModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    const safeName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!safeName) return;
    onCreate({ name: safeName, description: description.trim() });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Create a channel</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <p style={{ fontSize: 14, color: '#616061', marginBottom: 16 }}>
            Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.
          </p>
          <label className="modal__label">Name</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 10, color: '#868686', fontSize: 15, fontWeight: 700 }}>#</span>
            <input
              className="modal__input"
              style={{ paddingLeft: 28 }}
              placeholder="e.g. plan-budget"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <label className="modal__label">Description <span style={{ fontWeight: 400, color: '#868686' }}>(optional)</span></label>
          <textarea
            className="modal__textarea"
            placeholder="What's this channel about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="modal__footer">
          <button className="btn btn--cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!name.trim()}>Create</button>
        </div>
      </div>
    </div>
  );
}
