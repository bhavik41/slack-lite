import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

export default function ThreadPanel({
  parentMessage,
  userId,
  socket,
  onClose,
  onClickUser,
  onReact,
}) {
  const [replies, setReplies] = useState([]);
  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!parentMessage?._id || !socket) return;

    // Fetch thread replies history
    socket.emit('room:fetchThreadHistory', { parentMessageId: parentMessage._id });

    const handleThreadHistory = ({ parentMessageId, messages }) => {
      if (parentMessageId === parentMessage._id) {
        setReplies(messages);
      }
    };

    const handleNewMessage = ({ roomId, message }) => {
      if (message.parentMessageId === parentMessage._id) {
        setReplies((prev) => [...prev, message]);
      }
    };

    const handleMessageEdited = ({ messageId, content, isEdited, updatedAt }) => {
      setReplies((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content, isEdited, updatedAt } : m))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setReplies((prev) => prev.filter((m) => m._id !== messageId));
    };

    const handleReacted = ({ messageId, reactions }) => {
      setReplies((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on('room:threadHistory', handleThreadHistory);
    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleMessageEdited);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('message:reacted', handleReacted);

    return () => {
      socket.off('room:threadHistory', handleThreadHistory);
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleMessageEdited);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('message:reacted', handleReacted);
    };
  }, [parentMessage?._id, socket]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  if (!parentMessage) return null;

  const handleSend = () => {
    const text = draft.trim();
    if (!text && !uploading) return;

    let room;
    if (parentMessage.roomType === 'group') {
      room = { type: 'group', groupId: parentMessage.roomId.replace('group:', '') };
    } else {
      room = { type: 'dm', participants: parentMessage.roomId.replace('dm:', '').split(':') };
    }

    socket.emit('message:send', {
      room,
      content: text,
      parentMessageId: parentMessage._id,
    });
    setDraft('');
  };

  return (
    <div className="thread-panel">
      <div className="thread-panel__header">
        <div>
          <h3>Thread</h3>
          <span className="thread-panel__channel-name">#{parentMessage.senderUsername}'s post</span>
        </div>
        <button className="thread-panel__close-btn" onClick={onClose}>×</button>
      </div>

      <div className="thread-panel__scrollable">
        {/* Parent Message */}
        <div className="thread-panel__parent">
          <MessageBubble
            message={parentMessage}
            userId={userId}
            onReact={onReact}
            onClickUser={onClickUser}
            isContinuation={false}
            isThreadView={true}
          />
        </div>

        <div className="thread-panel__replies-divider">
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>

        {/* Replies List */}
        <div className="thread-panel__replies">
          {replies.map((reply, index) => {
            const isContinuation =
              index > 0 &&
              replies[index - 1].senderId === reply.senderId &&
              new Date(reply.createdAt).getTime() - new Date(replies[index - 1].createdAt).getTime() < 5 * 60 * 1000;

            return (
              <MessageBubble
                key={reply._id}
                message={reply}
                userId={userId}
                onReact={onReact}
                onClickUser={onClickUser}
                isContinuation={isContinuation}
                isThreadView={true}
                socket={socket}
              />
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="thread-panel__footer">
        <MessageInput
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          placeholder="Reply..."
        />
      </div>
    </div>
  );
}
