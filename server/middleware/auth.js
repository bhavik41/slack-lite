// Rate limiting middleware
const rateLimit = {};
const WINDOW = 60000; // 1 min
const MAX = 100;

export function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (!rateLimit[ip]) rateLimit[ip] = [];
  rateLimit[ip] = rateLimit[ip].filter(t => now - t < WINDOW);
  if (rateLimit[ip].length >= MAX) return res.status(429).json({ error: "Too many requests" });
  rateLimit[ip].push(now);
  next();
}
