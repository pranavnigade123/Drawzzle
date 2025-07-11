import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import socket from '../sockets/lobby';
import { ReactSketchCanvas } from 'react-sketch-canvas';

const Game = () => {
  const { state } = useLocation();
  const { lobbyCode } = useParams();
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname');
  const socketId = localStorage.getItem('socketId');

  const [game, setGame] = useState(state?.game || null);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(null); // Initialize as null (no guess)
  const [messages, setMessages] = useState([]);

  const canvasRef = useRef(null);
  const isDrawer = game?.drawer?.socketId === socketId;

  useEffect(() => {
    if (!state?.game) {
      socket.emit('get-game', { code: lobbyCode });
    }

    const handleGameUpdate = (newGame) => {
      setGame(newGame);
      setIsCorrect(null); // Reset feedback on game update
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
      console.log('Game updated, round:', newGame.round, 'drawer:', newGame.drawer.nickname);
    };

    const handleDrawingUpdate = ({ paths }) => {
      if (!isDrawer && canvasRef.current) {
        canvasRef.current.loadPaths(paths);
      }
    };

    const handleGameFetched = (fetchedGame) => {
      setGame(fetchedGame);
    };

    const handleGameOver = ({ game }) => {
      navigate(`/game-over/${lobbyCode}`, { state: { game } });
    };

    const handleChatMessage = ({ nickname, message, isCorrect, timestamp }) => {
      setMessages((prev) => [...prev, { nickname, message, isCorrect, timestamp }]);
      console.log('Chat message received:', { nickname, message, isCorrect });
    };

    const handleGuessResult = ({ isCorrect: result }) => {
      console.log('Guess result received:', result);
      setIsCorrect(result);
      setTimeout(() => setIsCorrect(null), 3000); // Reset to null after 3 seconds
    };

    socket.on('game-updated', handleGameUpdate);
    socket.on('drawing-update', handleDrawingUpdate);
    socket.on('game-fetched', handleGameFetched);
    socket.on('game-over', handleGameOver);
    socket.on('chat-message', handleChatMessage);
    socket.on('guess-result', handleGuessResult);
    socket.on('lobby-error', ({ message }) => {
      alert(message);
      navigate('/');
    });

    return () => {
      socket.off('game-updated', handleGameUpdate);
      socket.off('drawing-update', handleDrawingUpdate);
      socket.off('game-fetched', handleGameFetched);
      socket.off('game-over', handleGameOver);
      socket.off('chat-message', handleChatMessage);
      socket.off('guess-result', handleGuessResult);
      socket.off('lobby-error');
    };
  }, [isDrawer, lobbyCode, navigate, state]);

  let debounceTimeout;
  const handleDrawChange = async () => {
    if (!canvasRef.current || !isDrawer) return;
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
      const paths = await canvasRef.current.exportPaths();
      socket.emit('drawing', { lobbyCode, paths });
    }, 100);
  };

  const handleGuessSubmit = () => {
    if (!guess.trim()) return;
    console.log('Submitting guess:', guess);
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

      {isDrawer && (
        <p className="text-lg font-bold mt-2">Draw this: {game.currentWord}</p>
      )}

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
            pointerEvents: isDrawer ? 'auto' : 'none',
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

          {isCorrect === true && (
            <p className="text-green-600 font-bold mt-4">🎉 You guessed it right!</p>
          )}
          {isCorrect === false && (
            <p className="text-red-500 font-bold mt-4">❌ Wrong guess!</p>
          )}
        </>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-bold">Chat</h3>
        <div className="h-40 overflow-y-auto border p-2">
          {messages.map((msg, i) => (
            <p key={i} className={msg.isCorrect ? 'text-green-600' : 'text-white'}>
              [{new Date(msg.timestamp).toLocaleTimeString()}] {msg.nickname}: {msg.message} {msg.isCorrect ? '(Correct!)' : ''}
            </p>
          ))}
        </div>
      </div>

      {isDrawer && (
        <button
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
          onClick={() => socket.emit('next-round', { code: lobbyCode })}
        >
          Next Round (Test)
        </button>
      )}
    </div>
  );
};

export default Game;