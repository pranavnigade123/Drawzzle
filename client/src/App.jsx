import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import LobbyRoom from './pages/LobbyRoom';
import Game from './pages/Game';
import GameOver from './pages/GameOver';
import './index.css';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/lobby/:lobbyCode" element={<LobbyRoom />} />
          <Route path="/game/:lobbyCode" element={<Game />} />
          <Route path="/game-over/:lobbyCode" element={<GameOver />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;