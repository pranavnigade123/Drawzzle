import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import socket from '../sockets/lobby';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const Game = () => {
  const { state } = useLocation();
  const { lobbyCode } = useParams();
  const nickname = localStorage.getItem('nickname');
  const socketId = localStorage.getItem('socketId');

  const [game, setGame] = useState(state?.game || null);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const canvasRef = useRef(null);
  const isDrawer = game?.drawer?.socketId === socketId;

  // Update canvas or game state
  useEffect(() => {
    const handleGameUpdate = (newGame) => {
      setGame(newGame);
    };

    const handleDrawingUpdate = ({ paths }) => {
      if (!isDrawer && canvasRef.current) {
        canvasRef.current.loadPaths(paths);
      }
    };

    socket.on('game-updated', handleGameUpdate);
    socket.on('drawing-update', handleDrawingUpdate);

    return () => {
      socket.off('game-updated', handleGameUpdate);
      socket.off('drawing-update', handleDrawingUpdate);
    };
  }, [isDrawer]);

  // Drawer draws and emits path
  const handleDrawChange = async () => {
    if (!canvasRef.current || !isDrawer) return;
    const paths = await canvasRef.current.exportPaths();
    socket.emit('drawing', { lobbyCode, paths });
  };

  const handleGuessSubmit = () => {
    socket.emit('submit-guess', { lobbyCode, nickname, guess });
    setGuess('');
  };

  if (!game) return <p className="text-center mt-10">Loading game...</p>;

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">🎮 Game Started!</h2>
      <p>🎯 Round: {game.round} / {game.totalRounds}</p>
      <p>🖌️ Drawer: {game.drawer.nickname}</p>
      <p>👥 Players: {game.players.length}</p>

      <p className="mt-2 text-yellow-400 text-lg">
  Hello, <strong>{nickname}</strong>! 🎉
  {isDrawer ? ' You are the DRAWER 🎨 – start drawing!' : ' You are a GUESSER 🤔 – try to guess the word!'}
</p>

      <div className="mt-6 mx-auto w-[500px] h-[400px] border-2 border-black">
        <ReactSketchCanvas
  ref={canvasRef}
  strokeWidth={4}
  strokeColor="black"
  className="w-full h-full"
  readOnly={!isDrawer}
  onChange={isDrawer ? handleDrawChange : undefined}
  style={{
    pointerEvents: isDrawer ? 'auto' : 'none', // disables interaction for guessers
  }}
/>

      </div>

      {!isDrawer && (
        <>
          <div className="mt-6">
            <input
              className="border p-2 rounded w-64"
              placeholder="Type your guess..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
            />
            <button
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleGuessSubmit}
            >
              Submit
            </button>
          </div>

          {isCorrect && (
            <p className="text-green-600 font-bold mt-4">🎉 You guessed it right!</p>
          )}
        </>
      )}
    </div>
  );
};

export default Game;
