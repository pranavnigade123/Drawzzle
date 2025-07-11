import redisClient from '../redis/redisClient.js';
import { createLobby, getLobby, joinLobby } from '../redis/lobbyStore.js';
import { WORDS } from '../utils/words.js';

export default function lobbySocket(io, socket) {
  const DISCONNECT_TIMEOUT = 30000; // 30 seconds

  socket.on('create-lobby', async ({ nickname }) => {
    const lobby = await createLobby(nickname, socket.id);
    await redisClient.expire(`lobby:${lobby.code}`, 3600);
    socket.join(lobby.code);
    socket.emit('lobby-created', { lobby });
    io.to(lobby.code).emit('lobby-updated', lobby);
  });

  socket.on('join-lobby', async ({ code, nickname }) => {
    const lobby = await joinLobby(code, nickname, socket.id);
    if (!lobby) {
      socket.emit('lobby-error', { message: 'Invalid code or nickname already taken.' });
      return;
    }
    await redisClient.expire(`lobby:${code}`, 3600);
    socket.join(code);
    io.to(code).emit('lobby-updated', lobby);
  });

  socket.on('get-lobby', async ({ code }) => {
    const lobby = await getLobby(code);
    if (lobby && lobby.players.find((p) => p.socketId === socket.id)) {
      socket.emit('lobby-updated', lobby);
    } else {
      socket.emit('lobby-error', { message: 'Lobby not found or you are not a member.' });
    }
  });

  socket.on('start-game', async ({ code }) => {
    const lobby = await getLobby(code);
    if (!lobby) {
      console.error(`Lobby ${code} not found for start-game`);
      socket.emit('lobby-error', { message: 'Lobby not found.' });
      return;
    }

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
      players: players.map((p) => ({ ...p, score: 0 })),
      guesses: [],
      currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
      roundStartTime: Date.now(),
      roundDuration: 60000,
    };

    await redisClient.set(`game:${code}`, JSON.stringify(game));
    await redisClient.expire(`game:${code}`, 3600);
    io.to(code).emit('game-started', { game });

    // Start round timer
    console.log(`Starting timer for game ${code}, round ${game.round}`);
    startRoundTimer(io, code, game);
  });

  socket.on('next-round', async ({ code }) => {
    const gameData = await redisClient.get(`game:${code}`);
    if (!gameData) {
      console.error(`Game ${code} not found for next-round`);
      return;
    }

    const game = JSON.parse(gameData);
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
    game.roundStartTime = Date.now();

    await redisClient.set(`game:${code}`, JSON.stringify(game));
    await redisClient.expire(`game:${code}`, 3600);
    io.to(code).emit('game-updated', game);

    // Start new round timer
    console.log(`Starting timer for game ${code}, round ${game.round}`);
    startRoundTimer(io, code, game);
  });

  socket.on('get-game', async ({ code }) => {
    const gameData = await redisClient.get(`game:${code}`);
    if (gameData) {
      const game = JSON.parse(gameData);
      if (game.players.find((p) => p.socketId === socket.id)) {
        const timeLeft = Math.max(0, game.roundDuration - (Date.now() - game.roundStartTime));
        socket.emit('game-fetched', game);
        socket.emit('timer-update', { timeLeft });
      } else {
        socket.emit('lobby-error', { message: 'Game not found or you are not a member.' });
      }
    } else {
      socket.emit('lobby-error', { message: 'Game not found.' });
    }
  });

  socket.on('reconnect-player', async ({ code, nickname }) => {
    const lobby = await getLobby(code);
    if (lobby && lobby.players.find((p) => p.nickname === nickname)) {
      lobby.players = lobby.players.map((p) =>
        p.nickname === nickname ? { ...p, socketId: socket.id } : p
      );
      await redisClient.set(`lobby:${code}`, JSON.stringify(lobby));
      await redisClient.expire(`lobby:${code}`, 3600);
      socket.join(code);
      io.to(code).emit('lobby-updated', lobby);
      socket.emit('lobby-updated', lobby);
    }

    const gameData = await redisClient.get(`game:${code}`);
    if (gameData) {
      const game = JSON.parse(gameData);
      if (game.players.find((p) => p.nickname === nickname)) {
        game.players = game.players.map((p) =>
          p.nickname === nickname ? { ...p, socketId: socket.id } : p
        );
        if (game.drawer.nickname === nickname) {
          game.drawer.socketId = socket.id;
        }
        await redisClient.set(`game:${code}`, JSON.stringify(game));
        await redisClient.expire(`game:${code}`, 3600);
        const timeLeft = Math.max(0, game.roundDuration - (Date.now() - game.roundStartTime));
        socket.emit('game-fetched', game);
        socket.emit('timer-update', { timeLeft });
      }
    }
  });

  socket.on('disconnect', async () => {
    const lobbies = await redisClient.keys('lobby:*');
    for (const key of lobbies) {
      const lobby = JSON.parse(await redisClient.get(key));
      if (lobby.players.find((p) => p.socketId === socket.id)) {
        setTimeout(async () => {
          const currentLobby = JSON.parse(await redisClient.get(key));
          if (!currentLobby.players.find((p) => p.socketId === socket.id)) return;
          currentLobby.players = currentLobby.players.filter((p) => p.socketId !== socket.id);
          if (currentLobby.players.length === 0) {
            await redisClient.del(key);
          } else {
            if (currentLobby.host === socket.id && currentLobby.players.length > 0) {
              currentLobby.host = currentLobby.players[0].socketId;
            }
            await redisClient.set(key, JSON.stringify(currentLobby));
            await redisClient.expire(key, 3600);
            io.to(lobby.code).emit('lobby-updated', currentLobby);
          }
        }, DISCONNECT_TIMEOUT);
      }
    }

    const games = await redisClient.keys('game:*');
    for (const key of games) {
      const game = JSON.parse(await redisClient.get(key));
      if (game.players.find((p) => p.socketId === socket.id)) {
        setTimeout(async () => {
          const currentGame = JSON.parse(await redisClient.get(key));
          if (!currentGame.players.find((p) => p.socketId === socket.id)) return;
          currentGame.players = currentGame.players.filter((p) => p.socketId !== socket.id);
          if (currentGame.players.length === 0) {
            await redisClient.del(key);
          } else {
            if (currentGame.drawer.socketId === socket.id && currentGame.players.length > 0) {
              currentGame.drawer = currentGame.players[0];
              currentGame.drawerIndex = 0;
            }
            await redisClient.set(key, JSON.stringify(currentGame));
            await redisClient.expire(key, 3600);
            io.to(game.code).emit('game-updated', currentGame);
          }
        }, DISCONNECT_TIMEOUT);
      }
    }
  });

  async function startRoundTimer(io, code, game) {
    // Clear existing timers for this game
    await redisClient.del(`timer:${code}`);
    await redisClient.del(`interval:${code}`);

    // Start round timer
    const timerId = setTimeout(async () => {
      console.log(`Timer expired for game ${code}, round ${game.round}`);
      const gameData = await redisClient.get(`game:${code}`);
      if (!gameData) {
        console.error(`Game ${code} not found on timer expiration`);
        return;
      }
      const currentGame = JSON.parse(gameData);
      if (currentGame.round >= currentGame.totalRounds) {
        await redisClient.del(`game:${code}`);
        await redisClient.del(`timer:${code}`);
        io.to(code).emit('game-over', { game: currentGame });
        return;
      }
      currentGame.round += 1;
      currentGame.drawerIndex = (currentGame.drawerIndex + 1) % currentGame.players.length;
      currentGame.drawer = currentGame.players[currentGame.drawerIndex];
      currentGame.guesses = [];
      currentGame.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      currentGame.roundStartTime = Date.now();

      await redisClient.set(`game:${code}`, JSON.stringify(currentGame));
      await redisClient.expire(`game:${code}`, 3600);
      io.to(code).emit('game-updated', currentGame);

      // Start new timer
      startRoundTimer(io, code, currentGame);
    }, game.roundDuration);

    // Store timer ID in Redis to allow cleanup
    await redisClient.set(`timer:${code}`, timerId[Symbol.toPrimitive]());

    // Update timer every second
    const intervalId = setInterval(async () => {
      const gameData = await redisClient.get(`game:${code}`);
      if (!gameData) {
        clearInterval(intervalId);
        await redisClient.del(`interval:${code}`);
        return;
      }
      const currentGame = JSON.parse(gameData);
      const elapsed = Date.now() - currentGame.roundStartTime;
      const timeLeft = Math.max(0, currentGame.roundDuration - elapsed);
      io.to(code).emit('timer-update', { timeLeft });
      if (timeLeft <= 0) {
        clearInterval(intervalId);
        await redisClient.del(`interval:${code}`);
      }
    }, 1000);

    // Store interval ID in Redis
    await redisClient.set(`interval:${code}`, intervalId[Symbol.toPrimitive]());
  }
}