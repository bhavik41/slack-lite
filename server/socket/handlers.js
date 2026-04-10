// Socket event handlers
export function registerHandlers(io, socket) {
  socket.on("typing:start", ({ channelId, userId }) => {
    socket.to(channelId).emit("user:typing", { userId });
  });
  socket.on("typing:stop", ({ channelId, userId }) => {
    socket.to(channelId).emit("user:stopped_typing", { userId });
  });
}

// TODO: move channel join/leave here
