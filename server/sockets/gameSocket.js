import redisClient from '../redis/redisClient.js';
import { WORDS } from '../utils/words.js';

export default function gameSocket(io, socket) {
  socket.on('drawing', async ({ lobbyCode, paths }) => {
    const gameData = await redisClient.get(`game:${lobbyCode}`);
    if (!gameData) return;

    const game = JSON.parse(gameData);
    if (game?.drawer?.socketId === socket.id) {
      socket.to(lobbyCode).emit('drawing-update', { paths });
    }
  });

  socket.on('submit-guess', async ({ lobbyCode, nickname, guess }) => {
    const gameData = await redisClient.get(`game:${lobbyCode}`);
    if (!gameData) {
      console.error('No game data found for lobby:', lobbyCode);
      return;
    }

    const game = JSON.parse(gameData);
    if (!game.currentWord) {
      console.error('No currentWord in game state for lobby:', lobbyCode);
      return;
    }

    const isCorrect = guess.toLowerCase().trim() === game.currentWord.toLowerCase().trim();
    const player = game.players.find(p => p.nickname === nickname);

    if (!player) {
      console.error('Player not found:', nickname);
      return;
    }

    if (!player.score) player.score = 0;
    if (isCorrect) {
      player.score += 100;
      socket.emit('guess-result', { isCorrect: true });
      io.to(lobbyCode).emit('chat-message', { nickname, message: guess, isCorrect: true, timestamp: Date.now() });
      await redisClient.set(`game:${lobbyCode}`, JSON.stringify(game));
      io.to(lobbyCode).emit('game-updated', game);
      setTimeout(() => {
        io.to(lobbyCode).emit('next-round', { code: lobbyCode });
      }, 1000);
    } else {
      console.log(`Incorrect guess by ${nickname}: ${guess}`);
      io.to(lobbyCode).emit('chat-message', { nickname, message: guess, isCorrect: false, timestamp: Date.now() });
      socket.emit('guess-result', { isCorrect: false });
    }

    game.guesses.push({ nickname, guess, isCorrect });
    await redisClient.set(`game:${lobbyCode}`, JSON.stringify(game));
  });
}