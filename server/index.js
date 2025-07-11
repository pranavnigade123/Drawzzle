import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Redis Client and Sockets
import redisClient from './redis/redisClient.js';
import lobbySocket from './sockets/lobbySocket.js';
import gameSocket from './sockets/gameSocket.js';

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

let isRedisConnected = false;

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

  // Initialize socket handlers
  lobbySocket(io, socket); // Ensure lobbySocket is registered
  gameSocket(io, socket); // Ensure gameSocket is registered

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  });
});

// Initialize Redis connection only if not already connected
if (!isRedisConnected) {
  redisClient.connect()
    .then(() => {
      console.log('✅ Redis connected successfully!');
      isRedisConnected = true;
    })
    .catch((err) => {
      console.error('❌ Redis connection failed:', err);
    });
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
});