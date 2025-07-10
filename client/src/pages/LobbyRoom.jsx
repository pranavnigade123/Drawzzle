import { useEffect, useState } from 'react';
import socket from '../sockets/lobby';

const LobbyRoom = () => {
  const [lobbyData, setLobbyData] = useState(null);

  useEffect(() => {
    socket.on('lobby-updated', (data) => {
      setLobbyData(data);
    });

    socket.on('lobby-error', (err) => {
      alert(err.message);
    });

    return () => {
      socket.off('lobby-updated');
      socket.off('lobby-error');
    };
  }, []);

  return (
    <div>
      <h2>Lobby Code: {lobbyData?.code}</h2>
      <ul>
        {lobbyData?.players.map((player) => (
          <li key={player}>{player}</li>
        ))}
      </ul>
    </div>
  );
};

export default LobbyRoom;
