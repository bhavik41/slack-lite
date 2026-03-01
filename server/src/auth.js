import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken({ userId, username }) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register({ username, password }) {
  if (!username || !password) throw new Error('Missing username/password');

  const existing = await User.findOne({ username }).lean();
  if (existing) throw new Error('Username already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, passwordHash });

  return {
    userId: user.userId,
    username: user.username,
    token: signToken({ userId: user.userId, username: user.username }),
  };
}

export async function login({ username, password }) {
  const user = await User.findOne({ username }).lean();
  if (!user) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');

  return {
    userId: user.userId,
    username: user.username,
    token: signToken({ userId: user.userId, username: user.username }),
  };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

