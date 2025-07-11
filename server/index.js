import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import redisClient from './redis/redisClient.js';
import chatSocket from './sockets/chatSocket.js';
import gameSocket from './sockets/gameSocket.js';
import lobbySocket from './sockets/lobbySocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  lobbySocket(io, socket);
  gameSocket(io, socket);
  chatSocket(io, socket);
});

redisClient.connect()
  .then(() => console.log('✅ Redis connected successfully!'))
  .catch((err) => console.error('❌ Redis connection failed:', err));

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});