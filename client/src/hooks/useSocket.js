import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(url) {
  const socket = useRef(null);
  useEffect(() => {
    socket.current = io(url);
    return () => socket.current?.disconnect();
  }, [url]);
  return socket;
}

// Auto-reconnect with exponential backoff on disconnect
