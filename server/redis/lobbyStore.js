import redisClient from './redisClient.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';


export const createLobby = async (hostNickname) => {
  const lobbyCode = generateRoomCode();
  const lobbyData = {
    code: lobbyCode,
    host: hostNickname,
    players: [hostNickname],
  };

  await redisClient.set(`lobby:${lobbyCode}`, JSON.stringify(lobbyData));
  
  return lobbyData;
};

export const joinLobby = async (lobbyCode, nickname) => {
  const lobbyRaw = await redisClient.get(`lobby:${lobbyCode}`);
  if (!lobbyRaw) return null;

  const lobbyData = JSON.parse(lobbyRaw);
  lobbyData.players.push(nickname);

  await redisClient.set(`lobby:${lobbyCode}`, JSON.stringify(lobbyData));

  return lobbyData;
};
