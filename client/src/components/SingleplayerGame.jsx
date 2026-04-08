import { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { useNavigate } from "react-router-dom";

const SingleplayerGame = () => {
  const [gameState, setGameState] = useState("idle"); // idle, memorising, guessing, result
  const [targetColour, setTargetColour] = useState({ r: 0, g: 0, b: 0 });
  const [userHex, setUserHex] = useState("#ffffff");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(null);

  const navigate = useNavigate();

  // generate a random RGB colour for the target
  const generateRandomColour = () => ({
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  });

  // convert hex colour to RGB due to the colour picker returning hex values
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgbString = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

  // calculate the score based on the distance between the target and guess points in RGB space, then convert to a percentage
  const calculateScore = (target, guess) => {
    const maxDist = Math.sqrt(Math.pow(255, 2) * 3);
    const dist = Math.sqrt(
      Math.pow(target.r - guess.r, 2) +
        Math.pow(target.g - guess.g, 2) +
        Math.pow(target.b - guess.b, 2),
    );
    const percentage = Math.max(0, 100 - (dist / maxDist) * 100);
    setScore(percentage.toFixed(1));
  };

  // timer
  useEffect(() => {
    let timer;
    if (
      timeLeft > 0 &&
      (gameState === "memorising" || gameState === "guessing")
    ) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      if (gameState === "memorising") {
        setGameState("guessing");
        setTimeLeft(15); // 15 seconds to guess the colour
      } else if (gameState === "guessing") {
        handleSubmit();
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const startGame = () => {
    setTargetColour(generateRandomColour());
    setUserHex("#ffffff");
    setGameState("memorising");
    setTimeLeft(8); // 8 seconds to memorise the colour
  };

  const handleSubmit = () => {
    calculateScore(targetColour, hexToRgb(userHex));
    setGameState("result");
  };

  return (
    <div className="game-board fade-in">
      <h2 className="game-title">Colour Guesser</h2>

      {gameState === "idle" && (
        <div>
          <button className="action-button fade-in" onClick={startGame}>
            Start Game
          </button>
          <button
            className="back-link"
            onClick={() => navigate("/")}
            style={{ marginTop: "15px" }}
          >
            Back to Menu
          </button>
        </div>
      )}

      {gameState === "memorising" && (
        <div className="fade-in">
          <p>Memorise this colour</p>
          <div className="timer-text">{timeLeft}s</div>
          <div
            className="colour-display"
            style={{ backgroundColor: rgbString(targetColour) }}
          />
        </div>
      )}

      {gameState === "guessing" && (
        <div className="fade-in">
          <p>Recreate the colour</p>
          <div className="timer-text">{timeLeft}s</div>
          <div className="picker-container">
            <HexColorPicker color={userHex} onChange={setUserHex} />
          </div>
          <div className="current-guess-row">
            <span>Current Guess:</span>
            <div
              className="mini-preview"
              style={{ backgroundColor: userHex }}
            />
          </div>
          <button className="action-button" onClick={handleSubmit}>
            Submit Guess
          </button>
        </div>
      )}

      {gameState === "result" && (
        <div className="fade-in">
          <h3>Result</h3>
          <p style={{ fontSize: "20px", color: "#4caf50", margin: "15px 0" }}>
            Accuracy: <strong>{score}%</strong>
          </p>
          <div className="result-row">
            <div className="result-box">
              <strong>Target</strong>
              <div
                className="result-colour"
                style={{ backgroundColor: rgbString(targetColour) }}
              />
            </div>
            <div className="result-box">
              <strong>Your Guess</strong>
              <div
                className="result-colour"
                style={{ backgroundColor: userHex }}
              />
            </div>
          </div>
          <button className="action-button" onClick={startGame}>
            Play Again
          </button>
          <button className="back-link" onClick={() => navigate("/")}>
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default SingleplayerGame;
