import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../components/Button';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import GuessInput from '../components/GuessInput';
import useSocket from '../hooks/useSocket';
import socket from '../sockets/socket';

export default function Game() {
  const { state } = useLocation();
  const { lobbyCode } = useParams();
  const navigate = useNavigate();
  const nickname = localStorage.getItem('nickname');
  const socketId = localStorage.getItem('socketId');
  const [game, setGame] = useState(state?.game || null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const canvasRef = useRef(null);
  const isDrawer = game?.drawer?.socketId === socketId;

  useSocket({
    'game-updated': (newGame) => {
      if (newGame.players.find((p) => p.socketId === socketId)) {
        setGame(newGame);
        setIsCorrect(null);
        setTimeLeft(Math.floor(newGame.roundDuration / 1000)); // Reset timer
        if (canvasRef.current) {
          canvasRef.current.clearCanvas();
        }
      } else {
        toast.error('You are not in this game.');
        navigate('/');
      }
    },
    'drawing-update': ({ paths }) => {
      if (!isDrawer && canvasRef.current) {
        canvasRef.current.loadPaths(paths);
      }
    },
    'game-fetched': (fetchedGame) => {
      if (fetchedGame.players.find((p) => p.socketId === socketId)) {
        setGame(fetchedGame);
        setTimeLeft(Math.floor((fetchedGame.roundDuration - (Date.now() - fetchedGame.roundStartTime)) / 1000));
      } else {
        toast.error('You are not in this game.');
        navigate('/');
      }
    },
    'game-over': ({ game }) => navigate(`/game-over/${lobbyCode}`, { state: { game } }),
    'chat-message': ({ nickname, message, isCorrect, timestamp }) => {
      setMessages((prev) => [...prev, { nickname, message, isCorrect, timestamp }]);
    },
    'guess-result': ({ isCorrect }) => {
      setIsCorrect(isCorrect);
      setTimeout(() => setIsCorrect(null), 3000);
    },
    'lobby-error': ({ message }) => {
      toast.error(message);
      navigate('/');
    },
    'timer-update': ({ timeLeft }) => {
      setTimeLeft(Math.floor(timeLeft / 1000));
    },
  });

  useEffect(() => {
    if (!state?.game || !state.game.players.find((p) => p.socketId === socketId)) {
      socket.emit('get-game', { code: lobbyCode });
    }
  }, [lobbyCode, state, socketId]);

  const handleDrawChange = () => {
    if (!canvasRef.current || !isDrawer) return;

    const debounceTimeout = setTimeout(async () => {
      try {
        const paths = await canvasRef.current.exportPaths();
        socket.emit('drawing', { lobbyCode, paths });
      } catch (error) {
        console.error('Error exporting paths:', error);
      }
    }, 100);

    return () => clearTimeout(debounceTimeout);
  };

  const handleGuessSubmit = (guess) => {
    socket.emit('submit-guess', { lobbyCode, nickname, guess });
  };

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;
    socket.emit('send-message', { lobbyCode, nickname, message: chatInput });
    setChatInput('');
  };

  if (!game) return <p className="text-center mt-10">Loading game...</p>;

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">🎮 Game Started!</h2>
      <p>🎯 Round: {game.round} / {game.totalRounds}</p>
      <p>🖌️ Drawer: {game.drawer.nickname}</p>
      <p>👥 Players: {game.players.length}</p>
      <p className="text-lg font-bold mt-2">⏰ Time Left: {timeLeft !== null ? `${timeLeft}s` : 'Loading...'}</p>
      {isDrawer && <p className="text-lg font-bold mt-2">Draw this: {game.currentWord}</p>}
      <p className="mt-2 text-yellow-400 text-lg">
        Hello, <strong>{nickname}</strong>! 🎉
        {isDrawer ? ' You are the DRAWER 🎨 – start drawing!' : ' You are a GUESSER 🤔 – try to guess the word!'}
      </p>
      <Canvas isDrawer={isDrawer} onDrawChange={handleDrawChange} ref={canvasRef} />
      {!isDrawer && (
        <>
          <GuessInput onSubmit={handleGuessSubmit} isCorrect={isCorrect} />
          <div className="mt-4">
            <input
              className="border p-2 rounded w-64"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <Button className="ml-2 bg-blue-500 text-white" onClick={handleChatSubmit}>
              Send
            </Button>
          </div>
        </>
      )}
      <Chat messages={messages} />
      {isDrawer && (
        <Button
          className="mt-4 bg-purple-600 text-white"
          onClick={() => socket.emit('next-round', { code: lobbyCode })}
        >
          Next Round
        </Button>
      )}
    </div>
  );
}