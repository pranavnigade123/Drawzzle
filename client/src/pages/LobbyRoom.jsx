import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import socket from '../sockets/socket';

export default function LobbyRoom() {
  const { lobbyCode } = useParams();
  const { state } = useLocation();
  const [lobby, setLobby] = useState(state?.lobby || null);
  const navigate = useNavigate();
  const socketId = localStorage.getItem('socketId');

  useEffect(() => {
    if (!lobby || !lobby.players.find((p) => p.socketId === socketId)) {
      socket.emit('get-lobby', { code: lobbyCode });
    }

    socket.on('lobby-updated', (data) => {
      if (data.players.find((p) => p.socketId === socketId)) {
        setLobby(data);
      } else {
        toast.error('You are not in this lobby.');
        navigate('/');
      }
    });

    socket.on('game-started', ({ game }) => {
      navigate(`/game/${lobbyCode}`, { state: { game } });
    });

    socket.on('lobby-error', ({ message }) => {
      toast.error(message);
      navigate('/');
    });

    return () => {
      socket.off('lobby-updated');
      socket.off('game-started');
      socket.off('lobby-error');
    };
  }, [lobbyCode, lobby, socketId, navigate]);

  const handleStartGame = () => {
    socket.emit('start-game', { code: lobbyCode });
  };

  if (!lobby) return <p>Loading...</p>;

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">Lobby Code: {lobby.code}</h2>
      <h3 className="text-lg">Players:</h3>
      <ul className="mb-4">
        {lobby.players.map((p) => (
          <li key={p.nickname}>👤 {p.nickname}</li>
        ))}
      </ul>
      {lobby.host === socketId && (
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      )}
    </div>
  );
}