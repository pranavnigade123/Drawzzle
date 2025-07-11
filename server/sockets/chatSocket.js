export default function chatSocket(io, socket) {
  socket.on('send-message', ({ lobbyCode, nickname, message }) => {
    console.log(`Received message from ${nickname} in lobby ${lobbyCode}: ${message}`);
    io.to(lobbyCode).emit('chat-message', {
      nickname,
      message,
      isCorrect: false,
      timestamp: Date.now(),
    });
  });
}