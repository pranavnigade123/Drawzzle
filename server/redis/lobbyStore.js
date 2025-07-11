import redisClient from './redisClient.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

export async function createLobby(nickname, socketId) {
  const roomCode = generateRoomCode();
  const lobbyData = {
    code: roomCode,
    players: [{ nickname, socketId }],
    host: socketId,
  };

  await redisClient.set(`lobby:${roomCode}`, JSON.stringify(lobbyData));
  return lobbyData;
}

export async function joinLobby(code, nickname, socketId) {
  const raw = await redisClient.get(`lobby:${code}`);
  if (!raw) return null;

  const lobby = JSON.parse(raw);
  if (lobby.players.find((p) => p.nickname === nickname)) return null;

  lobby.players.push({ nickname, socketId });
  await redisClient.set(`lobby:${code}`, JSON.stringify(lobby));
  return lobby;
}

export async function getLobby(code) {
  const raw = await redisClient.get(`lobby:${code}`);
  return raw ? JSON.parse(raw) : null;
}