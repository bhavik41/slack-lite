import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { registerSocketHandlers, seedDefaultChannels } from './socketHandlers.js';
import { apiAuthRoutes } from './apiAuthRoutes.js';
import { UserStatus } from './models.js';
import { verifyToken } from './auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/slack-lite';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const logoutStore = new Map();

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', authMiddleware, upload.array('files'), (req, res) => {
  try {
    const files = (req.files || []).map((file) => ({
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      fileType: file.mimetype,
    }));
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', apiAuthRoutes({ logoutStore }));

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth || {};
    const token = auth.token;
    if (!token) return next();

    const decoded = verifyToken(token);
    if (logoutStore.has(decoded.jti || token)) return next(new Error('Logged out'));

    socket.user = { userId: decoded.userId, username: decoded.username };
    next();
  } catch (e) {
    // allow anonymous socket
    next();
  }
});

io.on('connection', (socket) => {
  registerSocketHandlers({ io, socket });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('Mongo connected');

  // ensure presence collection exists
  await UserStatus.init();

  // seed default channels (#general, #random)
  await seedDefaultChannels();
  console.log('Default channels seeded');

  server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
