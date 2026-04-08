import { useNavigate } from "react-router-dom";

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="game-board fade-in">
      <h2 className="game-title">Colour Guesser</h2>
      <div className="menu-buttons">
        <button
          className="action-button"
          onClick={() => navigate("/singleplayer")}
        >
          Play Solo
        </button>
        <button className="action-button" onClick={() => navigate("/lobby")}>
          Multiplayer
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
