import redisClient from '../redis/redisClient.js';
import { createLobby, joinLobby, getLobby } from '../redis/lobbyStore.js';
import { WORDS } from '../utils/words.js';

// Word list for the game
// const WORDS = ['apple', 'house', 'tree', 'car', 'dog'];

export default function lobbySocket(io, socket) {
  // Create lobby
  socket.on('create-lobby', async ({ nickname }) => {
    const lobby = await createLobby(nickname, socket.id);
    socket.join(lobby.code);
    socket.emit('lobby-created', { lobby });
    io.to(lobby.code).emit('lobby-updated', lobby);
  });

  // Join lobby
  socket.on('join-lobby', async ({ code, nickname }) => {
    const lobby = await joinLobby(code, nickname, socket.id);
    if (!lobby) {
      socket.emit('lobby-error', { message: 'Invalid code or nickname already taken.' });
      return;
    }
    socket.join(code);
    io.to(code).emit('lobby-updated', lobby);
  });

  // Get lobby
  socket.on('get-lobby', async ({ code }) => {
    const lobby = await getLobby(code);
    if (lobby) {
      socket.emit('lobby-updated', lobby);
    } else {
      socket.emit('lobby-error', { message: 'Lobby not found.' });
    }
  });

  // Start game
  socket.on('start-game', async ({ code }) => {
    const lobby = await getLobby(code);
    if (!lobby) return;

    const players = lobby.players;
    if (players.length < 2) {
      socket.emit('lobby-error', { message: 'At least 2 players required to start.' });
      return;
    }

    const drawerIndex = Math.floor(Math.random() * players.length);
    const game = {
      code,
      round: 1,
      totalRounds: 5,
      drawer: players[drawerIndex],
      drawerIndex,
      players: players.map(p => ({ ...p, score: 0 })),
      guesses: [],
      currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
    };

    await redisClient.set(`game:${code}`, JSON.stringify(game));
    io.to(code).emit('game-started', { game });
  });

  // Next round
  socket.on('next-round', async ({ code }) => {
    const gameData = await redisClient.get(`game:${code}`);
    if (!gameData) {
      console.error('No game data found for next round in lobby:', code);
      return;
    }

    const game = JSON.parse(gameData);
    console.log('Next round triggered, current round:', game.round);
    if (game.round >= game.totalRounds) {
      await redisClient.del(`game:${code}`);
      io.to(code).emit('game-over', { game });
      return;
    }

    game.round += 1;
    game.drawerIndex = (game.drawerIndex + 1) % game.players.length;
    game.drawer = game.players[game.drawerIndex];
    game.guesses = [];
    game.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];

    await redisClient.set(`game:${code}`, JSON.stringify(game));
    io.to(code).emit('game-updated', game);
    console.log('Next round completed, new round:', game.round);
  });

  // Get game state
  socket.on('get-game', async ({ code }) => {
    const gameData = await redisClient.get(`game:${code}`);
    if (gameData) {
      socket.emit('game-fetched', JSON.parse(gameData));
    } else {
      socket.emit('lobby-error', { message: 'Game not found.' });
    }
  });

  // Drawing
  socket.on('drawing', ({ lobbyCode, paths }) => {
  socket.to(lobbyCode).emit('drawing-update', { paths });
});

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  });
}