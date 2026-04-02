import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

function formatDateDivider(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function MessageList({
  messages,
  userId,
  onReact,
  onClickUser,
  channelName,
  onEdit,
  onDelete,
  onOpenThread,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="messages-container" ref={containerRef}>
        <div className="empty-state">
          <div className="empty-state__icon">💬</div>
          <div className="empty-state__title">
            {channelName ? `Welcome to #${channelName}` : 'No messages yet'}
          </div>
          <div className="empty-state__desc">
            This is the very beginning of the{' '}
            {channelName ? `#${channelName} channel` : 'conversation'}.
            Send a message to get things started!
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    );
  }

  // Group messages by date + detect continuation (same sender within 5 min)
  const grouped = [];
  let lastDate = null;
  let lastSender = null;
  let lastTime = 0;

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toDateString();
    const msgTime = new Date(msg.createdAt).getTime();

    if (msgDate !== lastDate) {
      grouped.push({ type: 'divider', date: msg.createdAt });
      lastDate = msgDate;
      lastSender = null;
      lastTime = 0;
    }

    const isContinuation =
      msg.senderId === lastSender && msgTime - lastTime < 5 * 60 * 1000;

    grouped.push({
      type: 'message',
      message: msg,
      isContinuation,
    });

    lastSender = msg.senderId;
    lastTime = msgTime;
  }

  return (
    <div className="messages-container" ref={containerRef}>
      {grouped.map((item, i) => {
        if (item.type === 'divider') {
          return (
            <div key={`div-${i}`} className="messages-date-divider">
              <span className="messages-date-divider__label">
                {formatDateDivider(item.date)}
              </span>
            </div>
          );
        }
        return (
          <MessageBubble
            key={item.message._id}
            message={item.message}
            isContinuation={item.isContinuation}
            userId={userId}
            onReact={onReact}
            onClickUser={onClickUser}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenThread={onOpenThread}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
