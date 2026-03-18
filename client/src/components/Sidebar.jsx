import React, { useState } from 'react';

export default function Sidebar({
  username,
  channels,
  dmUsers,
  activeRoom,
  onSelectChannel,
  onSelectDM,
  onCreateChannel,
  onLogout,
  currentUserId,
  unreadCounts = {},
}) {
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);

  function isActiveChannel(name) {
    return activeRoom?.type === 'group' && activeRoom?.groupId === name;
  }

  function isActiveDM(userId) {
    return activeRoom?.type === 'dm' && activeRoom?.participants?.includes(userId);
  }

  return (
    <div className="sidebar">
      {/* Workspace header */}
      <div className="sidebar__header">
        <div className="sidebar__workspace-name">
          Slack
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M2 3.5L5 7l3-3.5H2z" />
          </svg>
        </div>
        <button className="sidebar__compose-btn" title="New message">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>

      {/* Quick links */}
      <div className="sidebar__quicklinks">
        <div className="sidebar__quicklink">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
          <span>Threads</span>
        </div>
        <div className="sidebar__quicklink">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
          </svg>
          <span>All DMs</span>
        </div>
        <div className="sidebar__quicklink">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Activity</span>
        </div>
      </div>

      {/* Scrollable area */}
      <div className="sidebar__scrollable">
        {/* Channels section */}
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <button
              className={`sidebar__section-toggle ${!channelsOpen ? 'collapsed' : ''}`}
              onClick={() => setChannelsOpen(!channelsOpen)}
            >
              <svg viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 3l3 4 3-4H2z" />
              </svg>
              Channels
            </button>
            <button
              className="sidebar__section-add"
              title="Create channel"
              onClick={onCreateChannel}
            >
              +
            </button>
          </div>
          {channelsOpen &&
            channels.map((ch) => {
              const chRoomId = `group:${ch.name}`;
              const unreadCount = unreadCounts[chRoomId] || 0;
              return (
                <div
                  key={ch.name}
                  className={`sidebar__item ${isActiveChannel(ch.name) ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => onSelectChannel(ch.name)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="sidebar__item-icon">#</span>
                    <span className="sidebar__item-name" style={{ fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}>{ch.name}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="sidebar__unread-badge" style={{ backgroundColor: '#de4e2b', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Direct Messages section */}
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <button
              className={`sidebar__section-toggle ${!dmsOpen ? 'collapsed' : ''}`}
              onClick={() => setDmsOpen(!dmsOpen)}
            >
              <svg viewBox="0 0 10 10" fill="currentColor">
                <path d="M2 3l3 4 3-4H2z" />
              </svg>
              Direct Messages
            </button>
          </div>
          {dmsOpen &&
            dmUsers.map((u) => {
              const dmRoomId = `dm:${[currentUserId, u.userId].sort().join(':')}`;
              const unreadCount = unreadCounts[dmRoomId] || 0;
              return (
                <div
                  key={u.userId}
                  className={`sidebar__item ${isActiveDM(u.userId) ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => onSelectDM(u)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className={`presence-dot ${u.online ? 'online' : 'offline'}`} />
                    <span className="sidebar__item-name" style={{ fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}>{u.username}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="sidebar__unread-badge" style={{ backgroundColor: '#de4e2b', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          {dmUsers.length === 0 && (
            <div className="sidebar__item" style={{ color: 'var(--sidebar-text-dim)', cursor: 'default' }}>
              <span className="sidebar__item-icon" style={{ opacity: 0.4 }}>👤</span>
              <span className="sidebar__item-name" style={{ fontStyle: 'italic', fontSize: 13 }}>
                No other users yet
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom user section */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--sidebar-separator)' }}>
        <div
          className="sidebar__item"
          style={{ margin: 0, paddingLeft: 12 }}
          onClick={onLogout}
        >
          <span className="sidebar__item-icon" style={{ fontSize: 14 }}>↩</span>
          <span className="sidebar__item-name" style={{ fontSize: 13 }}>
            Sign out · <strong>{username}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
