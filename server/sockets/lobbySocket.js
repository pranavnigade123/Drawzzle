import { createLobby, joinLobby } from '../redis/lobbyStore.js';

export default (io, socket) => {
  socket.on('create-lobby', async ({ nickname }) => {
    const lobby = await createLobby(nickname);
    socket.join(lobby.code);
    io.to(lobby.code).emit('lobby-updated', lobby);
  });

  socket.on('join-lobby', async ({ lobbyCode, nickname }) => {
    const lobby = await joinLobby(lobbyCode, nickname);
    if (!lobby) {
      socket.emit('lobby-error', { message: 'Lobby not found!' });
      return;
    }
    socket.join(lobby.code);
    io.to(lobby.code).emit('lobby-updated', lobby);
  });
};
