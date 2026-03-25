import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import AuthScreen from './AuthScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChannelHeader from './components/ChannelHeader.jsx';
import MessageList from './components/MessageList.jsx';
import MessageInput from './components/MessageInput.jsx';
import CreateChannelModal from './components/CreateChannelModal.jsx';
import UserProfilePanel from './components/UserProfilePanel.jsx';
import ThreadPanel from './components/ThreadPanel.jsx';
import SearchModal from './components/SearchModal.jsx';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function dmRoom(a, b) {
  return { type: 'dm', participants: [a, b] };
}

function getNormalizedActiveRoomId(room) {
  if (!room) return null;
  if (room.type === 'dm') {
    const [a, b] = room.participants.slice().sort();
    return `dm:${a}:${b}`;
  }
  return `group:${room.groupId}`;
}

export default function App() {
  const socketRef = useRef(null);

  /* ── Auth state ── */
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');

  /* ── Data state ── */
  const [presence, setPresence] = useState({});
  const [channels, setChannels] = useState([]);
  const [dmUsers, setDmUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const activeRoomRef = useRef(activeRoom);
  
  useEffect(() => {
    activeRoomRef.current = activeRoom;
    const normId = getNormalizedActiveRoomId(activeRoom);
    if (normId) {
      setUnreadCounts((prev) => ({ ...prev, [normId]: 0 }));
    }
  }, [activeRoom]);

  const [messages, setMessages] = useState([]);
  const [typingPeers, setTypingPeers] = useState({});

  /* ── UI state ── */
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [draft, setDraft] = useState('');
  const [threadParentMessage, setThreadParentMessage] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showSearch, setShowSearch] = useState(false);

  const typingTimeoutRef = useRef(null);

  /* ── Restore session ── */
  useEffect(() => {
    const t = localStorage.getItem('slackLite:token') || '';
    if (!t) return;
    setToken(t);

    fetch(`${SERVER_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Not authenticated');
        return r.json();
      })
      .then((me) => {
        setUserId(me.userId);
        setUsername(me.username);
      })
      .catch(() => {
        localStorage.removeItem('slackLite:token');
      });
  }, []);

  /* ── Socket connection ── */
  useEffect(() => {
    if (!userId || !username || !token) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('presence:requestAll');
      socket.emit('channel:list');
      socket.emit('users:list');
    });

    // Presence
    socket.on('presence:all', (users) => {
      const map = {};
      for (const u of users) map[u.userId] = { username: u.username, online: u.online };
      setPresence(map);
    });

    socket.on('presence:update', ({ userId: pid, username: uname, online }) => {
      setPresence((prev) => ({
        ...prev,
        [pid]: { username: uname, online },
      }));
      // Also update DM users list
      setDmUsers((prev) =>
        prev.map((u) => (u.userId === pid ? { ...u, online } : u))
      );
    });

    // Channels
    socket.on('channel:list', (chs) => {
      setChannels(chs);
    });
    socket.on('channel:created', (ch) => {
      setChannels((prev) => {
        if (prev.find((c) => c.name === ch.name)) return prev;
        return [...prev, ch];
      });
    });

    // Users
    socket.on('users:list', (users) => {
      setDmUsers(users);
    });

    // Messages
    socket.on('room:history', ({ roomId, messages: ms }) => {
      setMessages(ms);
    });
    socket.on('message:new', ({ message }) => {
      if (message.parentMessageId) {
        return; // thread replies are managed inside ThreadPanel.jsx
      }
      const activeNormId = getNormalizedActiveRoomId(activeRoomRef.current);
      if (message.roomId === activeNormId) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.roomId]: (prev[message.roomId] || 0) + 1,
        }));
      }
    });
    socket.on('message:reacted', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });
    socket.on('message:edited', ({ messageId, content, isEdited, updatedAt }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, content, isEdited, updatedAt } : m))
      );
      setThreadParentMessage((prev) =>
        prev && prev._id === messageId ? { ...prev, content, isEdited, updatedAt } : prev
      );
    });
    socket.on('message:deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setThreadParentMessage((prev) => (prev && prev._id === messageId ? null : prev));
    });
    socket.on('message:thread_updated', ({ parentMessageId, replyCount }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === parentMessageId ? { ...m, replyCount } : m))
      );
      setThreadParentMessage((prev) =>
        prev && prev._id === parentMessageId ? { ...prev, replyCount } : prev
      );
    });

    // Typing
    socket.on('typing', ({ userId: pid, username: uname, isTyping }) => {
      if (pid === userId) return;
      setTypingPeers((prev) => {
        const next = { ...prev };
        if (isTyping) next[pid] = { username: uname };
        else delete next[pid];
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, username, token]);

  /* ── Default room: #general ── */
  useEffect(() => {
    if (!userId || activeRoom) return;
    setActiveRoom({ type: 'group', groupId: 'general' });
  }, [userId, activeRoom]);

  /* ── Room switching ── */
  useEffect(() => {
    if (!socketRef.current || !activeRoom) return;
    socketRef.current.emit('room:join', { room: activeRoom });
    socketRef.current.emit('room:fetchHistory', { room: activeRoom, limit: 50 });
    setTypingPeers({});
    setDraft('');
  }, [activeRoom]);

  /* ── Typing ── */
  const emitTyping = useCallback(
    (isTyping) => {
      if (!socketRef.current || !activeRoom) return;
      socketRef.current.emit('typing', { room: activeRoom, isTyping, username });
    },
    [activeRoom, username]
  );

  function onDraftChange(v) {
    setDraft(v);
    if (!activeRoom) return;
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1000);
  }

  function send(content, files = []) {
    const text = (content || '').trim();
    if (!text && files.length === 0) return;
    socketRef.current?.emit('message:send', { room: activeRoom, content: text, files });
    setDraft('');
    emitTyping(false);
  }

  function handleEditMessage(messageId, content) {
    socketRef.current?.emit('message:edit', { messageId, content });
  }

  function handleDeleteMessage(messageId) {
    socketRef.current?.emit('message:delete', { messageId });
  }

  function handleOpenThread(message) {
    setThreadParentMessage(message);
  }

  /* ── Reactions ── */
  function handleReact(messageId, emoji) {
    socketRef.current?.emit('message:react', { messageId, emoji });
  }

  /* ── Channel creation ── */
  function handleCreateChannel({ name, description }) {
    socketRef.current?.emit('channel:create', { name, description });
  }

  /* ── Logout ── */
  async function handleLogout() {
    try {
      await fetch(`${SERVER_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem('slackLite:token');
    setToken('');
    setUserId('');
    setUsername('');
    setActiveRoom(null);
    setMessages([]);
    setChannels([]);
    setDmUsers([]);
    try {
      socketRef.current?.disconnect();
    } catch {}
  }

  /* ── Click user name -> profile ── */
  function handleClickUser(senderUsername) {
    // Find user from presence or dmUsers
    const dmUser = dmUsers.find((u) => u.username === senderUsername);
    const presEntry = Object.entries(presence).find(([, v]) => v.username === senderUsername);
    if (dmUser) {
      setProfileUser(dmUser);
    } else if (presEntry) {
      setProfileUser({
        userId: presEntry[0],
        username: presEntry[1].username,
        online: presEntry[1].online,
      });
    }
  }

  /* ── Typing text ── */
  const typingText = Object.keys(typingPeers).length
    ? Object.values(typingPeers)
        .map((x) => x.username)
        .join(', ') + ' is typing'
    : '';

  /* ── Determine current channel info & DM user ── */
  const currentChannelInfo = activeRoom?.type === 'group'
    ? channels.find((c) => c.name === activeRoom.groupId)
    : null;

  const currentDMUser = activeRoom?.type === 'dm'
    ? dmUsers.find((u) => activeRoom.participants.includes(u.userId))
    : null;

  const inputPlaceholder = activeRoom?.type === 'group'
    ? `Message #${activeRoom.groupId}`
    : activeRoom?.type === 'dm' && currentDMUser
    ? `Message ${currentDMUser.username}`
    : 'Type a message...';

  /* ── Auth gate ── */
  if (!token) {
    return (
      <AuthScreen
        SERVER_URL={SERVER_URL}
        onAuthed={(out) => {
          setToken(out.token);
          setUserId(out.userId);
          setUsername(out.username);
          localStorage.setItem('slackLite:token', out.token);
        }}
      />
    );
  }

  /* ── Main layout ── */
  return (
    <div className="app-shell">
      {/* Top bar */}
      <div className="app-topbar">
        <input
          className="app-topbar__search"
          placeholder="Search Slack"
          onClick={() => setShowSearch(true)}
          style={{ cursor: 'pointer' }}
          readOnly
        />
      </div>

      <div className="app-body">
        {/* Sidebar */}
        <Sidebar
          username={username}
          channels={channels}
          dmUsers={dmUsers}
          activeRoom={activeRoom}
          currentUserId={userId}
          unreadCounts={unreadCounts}
          onSelectChannel={(name) => {
            setActiveRoom({ type: 'group', groupId: name });
            setThreadParentMessage(null); // Close thread when switching channel
          }}
          onSelectDM={(user) => {
            setActiveRoom(dmRoom(userId, user.userId));
            setProfileUser(null);
            setThreadParentMessage(null); // Close thread when switching DM
          }}
          onCreateChannel={() => setShowCreateChannel(true)}
          onLogout={handleLogout}
        />

        {/* Main content */}
        <div className="main-content">
          <ChannelHeader
            activeRoom={activeRoom}
            channelInfo={currentChannelInfo}
            dmUser={currentDMUser}
          />

          <MessageList
            messages={messages}
            userId={userId}
            onReact={handleReact}
            onClickUser={handleClickUser}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onOpenThread={handleOpenThread}
            channelName={activeRoom?.type === 'group' ? activeRoom.groupId : null}
          />

          {/* Typing indicator */}
          <div className="typing-indicator">
            {typingText && (
              <>
                <span className="typing-dots">
                  <span /><span /><span />
                </span>
                {typingText}
              </>
            )}
          </div>

          <MessageInput
            draft={draft}
            onDraftChange={onDraftChange}
            onSend={send}
            placeholder={inputPlaceholder}
            workspaceUsers={dmUsers}
          />
        </div>

        {/* Thread Panel */}
        {threadParentMessage && (
          <ThreadPanel
            parentMessage={threadParentMessage}
            userId={userId}
            socket={socketRef.current}
            onClose={() => setThreadParentMessage(null)}
            onClickUser={handleClickUser}
            onReact={handleReact}
          />
        )}

        {/* Profile panel */}
        {profileUser && (
          <UserProfilePanel
            user={profileUser}
            onClose={() => setProfileUser(null)}
          />
        )}
      </div>

      {/* Create channel modal */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {/* Search Modal */}
      {showSearch && (
        <SearchModal
          socket={socketRef.current}
          onClose={() => setShowSearch(false)}
          onSelectRoom={(room) => {
            if (room.type === 'group') {
              setActiveRoom(room);
            } else {
              // room.participants contains [userId1, userId2]
              const otherUserId = room.participants.find(id => id !== userId);
              const otherUser = dmUsers.find(u => u.userId === otherUserId);
              if (otherUser) {
                setActiveRoom(dmRoom(userId, otherUser.userId));
              }
            }
          }}
        />
      )}
    </div>
  );
}
