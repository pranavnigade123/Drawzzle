import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import socket from '../sockets/lobby';

const LobbyRoom = () => {
  const { lobbyCode } = useParams();
  const { state } = useLocation();
  const [lobby, setLobby] = useState(state?.lobby || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.lobby) {
      socket.emit('get-lobby', { code: lobbyCode });
    }

    socket.on('lobby-updated', (data) => {
      setLobby(data);
    });

    socket.on('game-started', ({ game }) => {
      navigate(`/game/${lobbyCode}`, { state: { game } });
    });

    return () => {
      socket.off('lobby-updated');
      socket.off('game-started');
    };
  }, [lobbyCode, state, navigate]);

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

      {/* Only host sees this */}
      {lobby.host === socket.id && (
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      )}
    </div>
  );
};

export default LobbyRoom;
