import { useLocation } from 'react-router-dom';

export default function GameOver() {
  const { state } = useLocation();
  const game = state?.game;

  if (!game) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
      <h3 className="text-lg">Leaderboard</h3>
      <ul className="mb-4">
        {game.players
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((p) => (
            <li key={p.nickname}>
              👤 {p.nickname}: {p.score || 0} points
            </li>
          ))}
      </ul>
      <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded">
        Back to Home
      </a>
    </div>
  );
}