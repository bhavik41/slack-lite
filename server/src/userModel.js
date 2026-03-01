import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Simple userId generator (avoid external deps)
UserSchema.pre('validate', function (next) {
  if (this.userId) return next();
  this.userId = `user_${this._id}`;
  next();
});

export const User = mongoose.model('User', UserSchema);

