import { createLobby, joinLobby, getLobby } from '../redis/lobbyStore.js';

export default function lobbySocket(io, socket) {
  // ✅ CREATE LOBBY
  socket.on('create-lobby', async ({ nickname }) => {
    const lobby = await createLobby(nickname, socket.id);
    socket.join(lobby.code);

    socket.emit('lobby-created', { lobby });
    io.to(lobby.code).emit('lobby-updated', lobby);
  });

  // ✅ JOIN LOBBY
  socket.on('join-lobby', async ({ code, nickname }) => {
    const lobby = await joinLobby(code, nickname, socket.id);

    if (!lobby) {
      socket.emit('lobby-error', { message: 'Invalid code or nickname already taken.' });
      return;
    }

    socket.join(code);
    io.to(code).emit('lobby-updated', lobby);
  });

  // ✅ GET LOBBY (used for reloading)
  socket.on('get-lobby', async ({ code }) => {
    const lobby = await getLobby(code);
    if (lobby) {
      socket.emit('lobby-updated', lobby);
    } else {
      socket.emit('lobby-error', { message: 'Lobby not found.' });
    }
  });

  // ✅ START GAME
  socket.on('start-game', async ({ code }) => {
    const lobby = await getLobby(code);
    if (!lobby) return;

    // Pick a random drawer
    const players = lobby.players;
    const drawerIndex = Math.floor(Math.random() * players.length);
    const drawer = players[drawerIndex];

    const game = {
      code,
      round: 1,
      totalRounds: 5,
      drawer,
      players,
      guesses: [],
    };

    io.to(code).emit('game-started', { game });
  });

  socket.on('drawing', ({ lobbyCode, paths }) => {
    
  // Broadcast to everyone EXCEPT the drawer
  socket.to(lobbyCode).emit('drawing-update', { paths });
});


  // ✅ Handle disconnect (optional future enhancement)
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    // Handle removal from lobby or game later if needed
  });
}
