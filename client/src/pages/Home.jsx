import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [nickname, setNickname] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const navigate = useNavigate();

  // in handleCreateLobby
const handleCreateLobby = () => {
  socket.emit('create-lobby', { nickname });
};

// in handleJoinLobby
const handleJoinLobby = () => {
  socket.emit('join-lobby', { lobbyCode, nickname });
};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <input
        className="border rounded p-2"
        placeholder="Enter your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleCreateLobby}
      >
        Create Lobby
      </button>

      <div className="flex gap-2">
        <input
          className="border rounded p-2"
          placeholder="Lobby Code"
          value={lobbyCode}
          onChange={(e) => setLobbyCode(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleJoinLobby}
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
};

export default Home;
