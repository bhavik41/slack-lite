import { Message, UserStatus, Channel } from './models.js';
import { User } from './userModel.js';

// In-memory presence mapping (socketId -> userId)
const socketToUser = new Map();

function normalizeRoomId({ type, participants, groupId }) {
  if (type === 'dm') {
    const [a, b] = participants.slice().sort();
    return `dm:${a}:${b}`;
  }
  return `group:${groupId}`;
}

/* Seed #general and #random if they don't exist yet */
export async function seedDefaultChannels() {
  const defaults = [
    { name: 'general', description: 'Company-wide announcements and work-based matters', isDefault: true },
    { name: 'random', description: 'Non-work banter and water cooler conversation', isDefault: true },
  ];
  for (const ch of defaults) {
    await Channel.updateOne({ name: ch.name }, { $setOnInsert: ch }, { upsert: true });
  }
}

export function registerSocketHandlers({ io, socket }) {
  const socketUser = socket.user;
  socketToUser.set(socket.id, socketUser?.userId);

  // ── Legacy identify (kept for backwards compat) ──
  socket.on('identify', async ({ userId, username }) => {
    if (!userId || !username) return;
    socketToUser.set(socket.id, userId);
    await UserStatus.updateOne(
      { userId },
      { $set: { username, online: true, updatedAt: new Date() } },
      { upsert: true }
    );
    io.emit('presence:update', { userId, username, online: true });
  });

  // Auto-presence for JWT-authenticated sockets
  if (socketUser?.userId && socketUser?.username) {
    UserStatus.updateOne(
      { userId: socketUser.userId },
      { $set: { username: socketUser.username, online: true, updatedAt: new Date() } },
      { upsert: true }
    ).then(() => {
      io.emit('presence:update', { userId: socketUser.userId, username: socketUser.username, online: true });
    });
  }

  // ── Presence ──
  socket.on('presence:requestAll', async () => {
    const users = await UserStatus.find({}).lean();
    socket.emit('presence:all', users);
  });

  // ── Channels ──
  socket.on('channel:list', async () => {
    const channels = await Channel.find({}).sort({ isDefault: -1, name: 1 }).lean();
    socket.emit('channel:list', channels);
  });

  socket.on('channel:create', async ({ name, description }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;
    const safeName = (name || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!safeName) return;

    try {
      const ch = await Channel.create({ name: safeName, description: description || '', createdBy: userId });
      io.emit('channel:created', ch);
    } catch (e) {
      socket.emit('channel:error', { error: e.message });
    }
  });

  // ── Users list (for DM sidebar) ──
  socket.on('users:list', async () => {
    const currentUserId = socketToUser.get(socket.id);
    const users = await User.find({}, { userId: 1, username: 1, _id: 0 }).lean();
    const statuses = await UserStatus.find({}, { userId: 1, online: 1, _id: 0 }).lean();
    const statusMap = {};
    for (const s of statuses) statusMap[s.userId] = s.online;

    const result = users
      .filter((u) => u.userId !== currentUserId)
      .map((u) => ({ userId: u.userId, username: u.username, online: !!statusMap[u.userId] }));
    socket.emit('users:list', result);
  });

  // ── Rooms ──
  socket.on('room:join', async ({ room }) => {
    if (!room?.type) return;
    const roomId = normalizeRoomId(room);
    socket.join(roomId);
    socket.emit('room:joined', { roomId });
  });

  socket.on('room:fetchHistory', async ({ room, limit = 50 }) => {
    if (!room?.type) return;
    const roomId = normalizeRoomId(room);
    const msgs = await Message.find({ roomId, parentMessageId: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    socket.emit('room:history', { roomId, messages: msgs.reverse() });
  });

  // ── Messages ──
  // ── Messages ──
  socket.on('message:send', async ({ room, content, files = [], parentMessageId = null }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId || (!content?.trim() && files.length === 0)) return;

    const sender = await UserStatus.findOne({ userId }).lean();
    const senderUsername = sender?.username || 'Unknown';
    const roomId = normalizeRoomId(room);

    const doc = await Message.create({
      roomId,
      roomType: room.type,
      senderId: userId,
      senderUsername,
      content: (content || '').trim(),
      files,
      parentMessageId,
    });

    if (parentMessageId) {
      await Message.findByIdAndUpdate(parentMessageId, { $inc: { replyCount: 1 } });
      const parent = await Message.findById(parentMessageId).lean();
      io.to(roomId).emit('message:thread_updated', {
        parentMessageId,
        replyCount: parent?.replyCount || 0,
      });
    }

    io.to(roomId).emit('message:new', {
      roomId,
      message: {
        _id: doc._id,
        roomId: doc.roomId,
        roomType: doc.roomType,
        senderId: doc.senderId,
        senderUsername: doc.senderUsername,
        content: doc.content,
        reactions: doc.reactions,
        parentMessageId: doc.parentMessageId,
        replyCount: doc.replyCount,
        files: doc.files,
        createdAt: doc.createdAt,
      },
    });
  });

  // ── Thread History ──
  socket.on('room:fetchThreadHistory', async ({ parentMessageId }) => {
    if (!parentMessageId) return;
    const msgs = await Message.find({ parentMessageId })
      .sort({ createdAt: 1 })
      .lean();
    socket.emit('room:threadHistory', { parentMessageId, messages: msgs });
  });

  // ── Edit Message ──
  socket.on('message:edit', async ({ messageId, content }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId || !messageId || !content?.trim()) return;

    const msg = await Message.findById(messageId);
    if (!msg || msg.senderId !== userId) return;

    msg.content = content.trim();
    msg.isEdited = true;
    await msg.save();

    io.to(msg.roomId).emit('message:edited', {
      messageId: msg._id,
      content: msg.content,
      isEdited: true,
      updatedAt: msg.updatedAt,
    });
  });

  // ── Delete Message ──
  socket.on('message:delete', async ({ messageId }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId || !messageId) return;

    const msg = await Message.findById(messageId);
    if (!msg || msg.senderId !== userId) return;

    const roomId = msg.roomId;
    const parentMessageId = msg.parentMessageId;

    await Message.findByIdAndDelete(messageId);

    if (parentMessageId) {
      await Message.findByIdAndUpdate(parentMessageId, { $inc: { replyCount: -1 } });
      const parent = await Message.findById(parentMessageId).lean();
      io.to(roomId).emit('message:thread_updated', {
        parentMessageId,
        replyCount: parent?.replyCount || 0,
      });
    } else {
      // If parent message is deleted, delete all replies too
      await Message.deleteMany({ parentMessageId: messageId });
    }

    io.to(roomId).emit('message:deleted', {
      messageId,
      parentMessageId,
    });
  });

  // ── Search Messages ──
  socket.on('message:search', async ({ query }) => {
    if (!query?.trim()) return;
    try {
      const results = await Message.find({
        content: { $regex: query.trim(), $options: 'i' },
        parentMessageId: null, // only search main messages, not thread replies
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
      socket.emit('message:searchResults', { query, results });
    } catch (e) {
      socket.emit('message:searchError', { error: e.message });
    }
  });

  // ── Reactions ──
  socket.on('message:react', async ({ messageId, emoji }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId || !messageId || !emoji) return;

    const sender = await UserStatus.findOne({ userId }).lean();
    const username = sender?.username || 'Unknown';

    const msg = await Message.findById(messageId);
    if (!msg) return;

    // Toggle: remove if already reacted with same emoji, else add
    const existing = msg.reactions.findIndex((r) => r.emoji === emoji && r.userId === userId);
    if (existing >= 0) {
      msg.reactions.splice(existing, 1);
    } else {
      msg.reactions.push({ emoji, userId, username });
    }
    await msg.save();

    io.to(msg.roomId).emit('message:reacted', {
      messageId: msg._id,
      reactions: msg.reactions,
    });
  });

  // ── Typing ──
  socket.on('typing', ({ room, isTyping, username }) => {
    if (!room?.type) return;
    const userId = socketToUser.get(socket.id);
    if (!userId) return;
    const roomId = normalizeRoomId(room);
    socket.to(roomId).emit('typing', { roomId, userId, username, isTyping: Boolean(isTyping) });
  });

  // ── Disconnect ──
  socket.on('disconnect', async () => {
    const userId = socketToUser.get(socket.id);
    socketToUser.delete(socket.id);
    if (!userId) return;

    await UserStatus.updateOne({ userId }, { $set: { online: false, updatedAt: new Date() } });
    const updated = await UserStatus.findOne({ userId }).lean();
    io.emit('presence:update', { userId, username: updated?.username, online: false });
  });
}
