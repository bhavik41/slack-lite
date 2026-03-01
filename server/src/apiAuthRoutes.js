import express from 'express';
import { login, register, verifyToken } from './auth.js';

export function apiAuthRoutes({ logoutStore }) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      const out = await register({ username, password });
      res.json(out);
    } catch (e) {
      res.status(400).json({ error: e.message || 'Register failed' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};
      const out = await login({ username, password });
      res.json(out);
    } catch (e) {
      res.status(400).json({ error: e.message || 'Login failed' });
    }
  });

  router.post('/logout', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
    if (token) {
      // best-effort blacklist for current session
      const decoded = verifyToken(token);
      logoutStore.set(decoded.jti || token, Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    res.json({ ok: true });
  });

  router.get('/me', async (req, res) => {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
      if (!token) return res.status(401).json({ error: 'Missing token' });
      const decoded = verifyToken(token);

      return res.json({ userId: decoded.userId, username: decoded.username });
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  return router;
}

