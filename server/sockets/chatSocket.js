export default function chatSocket(io, socket) {
  socket.on('send-message', ({ lobbyCode, nickname, message }) => {
    io.to(lobbyCode).emit('chat-message', { nickname, message, isCorrect: false, timestamp: Date.now() });
  });
}