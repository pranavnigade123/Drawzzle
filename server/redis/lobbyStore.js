import redisClient from './redisClient.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

// Create new lobby with host nickname

export const createLobby = async (nickname, socketId) => {
  const roomCode = generateRoomCode();

  const lobbyData = {
    code: roomCode,
    players: [{ nickname, socketId }],
    host: socketId
  };

  await redisClient.set(`lobby:${roomCode}`, JSON.stringify(lobbyData));
  return lobbyData;
};


// Join existing lobby
export const joinLobby = async (code, nickname, socketId) => {
  const raw = await redisClient.get(`lobby:${code}`);
  if (!raw) return null;

  const lobby = JSON.parse(raw);

  if (lobby.players.find(p => p.nickname === nickname)) return null;

  lobby.players.push({ nickname, socketId });

  await redisClient.set(`lobby:${code}`, JSON.stringify(lobby));
  return lobby;
};

// Get current lobby
export const getLobby = async (code) => {
  const raw = await redisClient.get(`lobby:${code}`);
  return raw ? JSON.parse(raw) : null;
};