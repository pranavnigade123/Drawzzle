import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import LobbyRoom from './pages/LobbyRoom';
import Game from './pages/Game';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/lobby/:lobbyCode" element={<LobbyRoom />} />
        <Route path="/game/:lobbyCode" element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
