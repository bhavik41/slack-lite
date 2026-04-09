// Helper utilities
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
export function truncate(str, n = 50) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export function sanitise(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// reactions: [{ emoji, users[] }]
