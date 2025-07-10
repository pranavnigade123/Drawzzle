import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Redis Client and Sockets
import redisClient from './redis/redisClient.js';
import lobbySocket from './sockets/lobbySocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Vite default frontend port
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initialize lobby socket handlers
  lobbySocket(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Initialize Redis connection
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

