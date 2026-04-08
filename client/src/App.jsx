import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "./components/MainMenu";
import Lobby from "./components/Lobby";
import SingleplayerGame from "./components/SingleplayerGame";
import MultiplayerGame from "./components/MultiplayerGame";
import "./styles.css";

const App = () => {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/singleplayer" element={<SingleplayerGame />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/multiplayer/:roomId" element={<MultiplayerGame />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
