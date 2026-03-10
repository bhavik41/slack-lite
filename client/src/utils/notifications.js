// Browser notifications
export function requestPermission() {
  if ("Notification" in window) Notification.requestPermission();
}
export function notify(title, body) {
  if (Notification.permission === "granted") new Notification(title, { body });
}
