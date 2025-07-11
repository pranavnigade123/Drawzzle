import redisClient from '../redis/redisClient.js';
import { WORDS } from '../utils/words.js';

export default function gameSocket(io, socket) {
  socket.on('drawing', async ({ lobbyCode, paths }) => {
    const gameData = await redisClient.get(`game:${lobbyCode}`);
    if (!gameData) {
      console.error(`Game ${lobbyCode} not found for drawing event`);
      return;
    }

    const game = JSON.parse(gameData);
    if (game?.drawer?.socketId === socket.id) {
      socket.to(lobbyCode).emit('drawing-update', { paths });
    }
  });

  socket.on('submit-guess', async ({ lobbyCode, nickname, guess }) => {
    console.log(`Processing guess from ${nickname} in lobby ${lobbyCode}: ${guess}`);
    const gameData = await redisClient.get(`game:${lobbyCode}`);
    if (!gameData) {
      console.error(`Game ${lobbyCode} not found for submit-guess`);
      socket.emit('lobby-error', { message: 'Game not found.' });
      return;
    }

    const game = JSON.parse(gameData);
    if (!game.currentWord) {
      console.error(`No current word for game ${lobbyCode}`);
      return;
    }

    const isCorrect = guess.toLowerCase().trim() === game.currentWord.toLowerCase().trim();
    const player = game.players.find((p) => p.nickname === nickname);

    if (!player) {
      console.error(`Player ${nickname} not found in game ${lobbyCode}`);
      socket.emit('lobby-error', { message: 'Player not found.' });
      return;
    }

    if (!player.score) player.score = 0;
    game.guesses.push({ nickname, guess, isCorrect });
    io.to(lobbyCode).emit('chat-message', { nickname, message: guess, isCorrect, timestamp: Date.now() });

    if (isCorrect) {
      player.score += 100;
      socket.emit('guess-result', { isCorrect: true });
      await redisClient.set(`game:${lobbyCode}`, JSON.stringify(game));
      io.to(lobbyCode).emit('game-updated', game);

      console.log(`Correct guess by ${nickname} in game ${lobbyCode}, advancing round`);
      if (game.round >= game.totalRounds) {
        await redisClient.del(`game:${lobbyCode}`);
        io.to(lobbyCode).emit('game-over', { game });
      } else {
        game.round += 1;
        game.drawerIndex = (game.drawerIndex + 1) % game.players.length;
        game.drawer = game.players[game.drawerIndex];
        game.guesses = [];
        game.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        game.roundStartTime = Date.now();

        await redisClient.set(`game:${lobbyCode}`, JSON.stringify(game));
        await redisClient.expire(`game:${lobbyCode}`, 3600);
        io.to(lobbyCode).emit('game-updated', game);
      }
    } else {
      socket.emit('guess-result', { isCorrect: false });
      await redisClient.set(`game:${lobbyCode}`, JSON.stringify(game));
    }
  });
}