---

# 🎨 Drawzzle — Real-Time Multiplayer Drawing Game

**Drawzzle** is a full-stack real-time multiplayer drawing and guessing game built with **React**, **Node.js**, **Socket.IO**, and **Redis**.
Players can create or join lobbies, draw prompts on a live canvas, and guess in real time — similar to Skribbl.io, but built entirely from scratch.

---

## 🚀 Features

* **🎯 Real-Time Gameplay:** Low-latency communication via Socket.IO enabling live drawing and guessing.
* **🖌 Interactive Canvas:** Built with React Konva; supports dynamic stroke color, brush sizes, and eraser tools.
* **💬 Live Chat:** Real-time messaging between players with correct-guess detection.
* **🏠 Lobby System:** Create and join game rooms with unique 6-character codes.
* **🔁 Redis Persistence:** All game states (players, rounds, timers) stored in Redis for fault tolerance and reconnects.
* **⏱ Round Timers & Scoring:** Automatic round transitions, synchronized countdowns, and leaderboard updates.
* **🧠 Word Pool:** Random word assignment for each round from a pre-defined word set.

---

## 🧠 Tech Stack

| Layer                     | Technologies                                                            |
| :------------------------ | :---------------------------------------------------------------------- |
| **Frontend**              | React 19, Vite, React-Konva, React Router, React Toastify, Tailwind CSS |
| **Backend**               | Node.js, Express, Socket.IO                                             |
| **Database / Cache**      | Redis                                                                   |
| **Build & Dev Tools**     | Vite, ESLint, Nodemon                                                   |
| **Hosting (Recommended)** | Vercel (Frontend), Render / Railway (Backend)                           |

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/Drawzzle.git
cd Drawzzle
```

### 2️⃣ Setup the Server

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=5000
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

### 3️⃣ Setup the Client

```bash
cd ../client
npm install
npm run dev
```

Client runs on [http://localhost:5173](http://localhost:5173)

---

## 🧩 Folder Structure

```
Drawzzle/
│
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Canvas, Chat, GuessInput, Button
│   │   ├── pages/          # Home, Lobby, Game, GameOver
│   │   ├── hooks/          # useSocket custom hook
│   │   └── sockets/        # Socket.IO client setup
│   └── vite.config.js
│
└── server/                 # Express + Socket.IO Backend
    ├── sockets/            # Handles lobby, game, and chat events
    ├── redis/              # Redis client + lobbyStore
    ├── utils/              # Helpers (generateRoomCode, words)
    └── index.js
```

---

## 🧠 Core Game Flow

1. Player enters nickname → creates or joins a lobby using a unique code.
2. Lobby host starts the game → one player is randomly assigned as the drawer.
3. Drawer draws the given word on canvas → others guess in chat.
4. Correct guesses earn points → next round begins with a new drawer and word.
5. After all rounds, leaderboard is displayed at **Game Over** screen.

---

## 🧰 Key Implementations

* **Socket Events:** `create-lobby`, `join-lobby`, `start-game`, `drawing`, `submit-guess`, `next-round`, `timer-update`
* **Real-Time Canvas Sync:** Each brush stroke is broadcast live via sockets and reconstructed on all connected clients.
* **Redis Store:**

  * `lobby:*` → Stores player lists & hosts
  * `game:*` → Tracks rounds, words, and scores
  * `timer:*` → Handles countdowns for each active game

---

## 🧪 Example Gameplay Flow

1. **Create Lobby:** Host sets nickname → system generates 6-digit code.
2. **Join Lobby:** Other players join using code.
3. **Start Game:** Drawer is assigned randomly, receives a word (e.g., *apple*).
4. **Draw & Guess:** Canvas syncs in real time; chat reflects correct guesses.
5. **Next Rounds:** Timer expires → next player becomes drawer.
6. **Game Over:** Scores displayed; players can replay or exit.

---

## 📊 Performance

* Canvas updates debounce at ~50ms for efficient socket emission.
* Average round duration: 60s
* Supports 50+ concurrent users per server instance.
* Redis TTL auto-cleans inactive lobbies after 1 hour.

---

## 🧩 Future Enhancements

* 🎮 Custom word packs
* 🧍‍♂️ Player avatars and chat emojis
* 🔊 Sound effects for correct guesses
* 🏆 Persistent user profiles with cumulative stats
* 📱 Mobile UI optimization

---

## 🤝 Contributing

Pull requests and feature suggestions are welcome!
Please open an issue first to discuss any major feature or architectural change.

---

## 📜 License

MIT License © 2025
Developed by **Pranav Nigade**

---
