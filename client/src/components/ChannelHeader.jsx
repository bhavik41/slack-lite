import React from 'react';

export default function ChannelHeader({ activeRoom, channelInfo, dmUser }) {
  const isChannel = activeRoom?.type === 'group';

  return (
    <div className="channel-header">
      <div className="channel-header__left">
        {isChannel ? (
          <>
            <h1 className="channel-header__name">
              <span className="channel-header__hash">#</span>
              {activeRoom.groupId}
            </h1>
            <span className="channel-header__star" title="Star this channel">☆</span>
            {channelInfo?.description && (
              <span className="channel-header__description">{channelInfo.description}</span>
            )}
          </>
        ) : (
          <h1 className="channel-header__name">
            {dmUser?.username || 'Direct Message'}
            {dmUser && (
              <span style={{ marginLeft: 8 }}>
                <span
                  className={`presence-dot ${dmUser.online ? 'online' : 'offline'}`}
                  style={{ display: 'inline-block', verticalAlign: 'middle' }}
                />
              </span>
            )}
          </h1>
        )}
      </div>
      <div className="channel-header__right">
        {isChannel && (
          <button className="channel-header__members" title="View all members">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </button>
        )}
        <button className="channel-header__action" title="Search">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
        <button className="channel-header__action" title="Pinned items">📌</button>
      </div>
    </div>
  );
}
