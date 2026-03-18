import React from 'react';

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `avatar-color-${Math.abs(hash) % 8}`;
}

export default function UserProfilePanel({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="profile-panel">
      <div className="profile-panel__header">
        <span className="profile-panel__title">Profile</span>
        <button className="profile-panel__close" onClick={onClose}>✕</button>
      </div>
      <div className="profile-panel__body">
        <div className={`profile-panel__avatar ${avatarColor(user.username)}`}>
          {user.username.charAt(0)}
        </div>
        <div className="profile-panel__name">{user.username}</div>
        <div className="profile-panel__status">
          <span
            className={`presence-dot ${user.online ? 'online' : 'offline'}`}
            style={{ width: 10, height: 10 }}
          />
          {user.online ? 'Active' : 'Away'}
        </div>
        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#616061', marginBottom: 4 }}>Display name</div>
          <div style={{ fontSize: 15, marginBottom: 16 }}>{user.username}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#616061', marginBottom: 4 }}>Local time</div>
          <div style={{ fontSize: 15 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    </div>
  );
}
