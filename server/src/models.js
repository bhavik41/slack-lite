import mongoose from 'mongoose';

const UserStatusSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    online: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const UserStatus = mongoose.model('UserStatus', UserStatusSchema);

/* ── Channel ── */
const ChannelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    createdBy: { type: String, default: 'system' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const Channel = mongoose.model('Channel', ChannelSchema);

/* ── Message ── */
const ReactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    roomType: { type: String, enum: ['dm', 'group'], required: true },
    senderId: { type: String, required: true, index: true },
    senderUsername: { type: String, required: true },
    content: { type: String, required: true },
    reactions: { type: [ReactionSchema], default: [] },
    parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', index: true },
    replyCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    files: {
      type: [{
        url: { type: String, required: true },
        name: { type: String, required: true },
        fileType: { type: String, required: true }
      }],
      default: []
    }
  },
  { timestamps: true, versionKey: false }
);

export const Message = mongoose.model('Message', MessageSchema);

