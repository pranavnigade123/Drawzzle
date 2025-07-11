import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import socket from '../sockets/lobby';
import { Button } from '../components/Button';

const Home = () => {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleCreateLobby = () => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname.');
      return;
    }
    socket.emit('create-lobby', { nickname });
  };

  const handleJoinLobby = () => {
    if (!nickname.trim() || !code.trim()) {
      toast.error('Please enter both nickname and lobby code.');
      return;
    }
    socket.emit('join-lobby', { code, nickname });
  };

  useEffect(() => {
    socket.on('lobby-created', ({ lobby }) => {
      localStorage.setItem('nickname', nickname);
      localStorage.setItem('socketId', socket.id);
      navigate(`/lobby/${lobby.code}`, { state: { lobby } });
    });

    socket.on('lobby-updated', (lobby) => {
      if (lobby.players.find((p) => p.nickname === nickname)) {
        localStorage.setItem('nickname', nickname);
        localStorage.setItem('socketId', socket.id);
        navigate(`/lobby/${lobby.code}`, { state: { lobby } });
      }
    });

    socket.on('lobby-error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off('lobby-created');
      socket.off('lobby-updated');
      socket.off('lobby-error');
    };
  }, [nickname, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold mb-4">🎨 Welcome to Drawzzle</h1>
      <input
        className="border p-2 rounded w-64"
        placeholder="Enter your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <Button className="bg-blue-600 text-white w-64" onClick={handleCreateLobby}>
        Create Lobby
      </Button>
      <div className="flex gap-2 mt-4">
        <input
          className="border p-2 rounded"
          placeholder="Lobby Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button className="bg-green-600 text-white" onClick={handleJoinLobby}>
          Join
        </Button>
      </div>
    </div>
  );
};

export default Home;