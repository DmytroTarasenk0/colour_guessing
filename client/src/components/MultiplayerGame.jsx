import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

const MultiplayerGame = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState("waiting_room"); // waiting_room, memorising, guessing, waiting_for_guesses, result
  const [players, setPlayers] = useState({});
  const [isReady, setIsReady] = useState(false);

  const [targetColour, setTargetColour] = useState({ r: 0, g: 0, b: 0 });
  const [userHex, setUserHex] = useState("#ffffff");
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState(null);

  const rgbString = (c) => `rgb(${c.r}, ${c.g}, ${c.b})`;

  // initial connection handshake
  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || "Guest";
    const savedPassword = localStorage.getItem("roomPassword") || "";

    // re-join the room in case of a page refresh
    socket.emit(
      "join_room",
      {
        username: savedUsername,
        roomId,
        password: savedPassword,
      },
      (res) => {
        if (res.status === "ERROR") {
          alert("Session lost or incorrect password. Returning to lobby.");
          navigate("/lobby");
        }
      },
    );
  }, [roomId, navigate]);

  // listen for Server Events on mount
  useEffect(() => {
    const onPlayerStatusUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
    };

    const onGameStarted = (colour) => {
      setTargetColour(colour);
      setUserHex("#ffffff");
      setGameState("memorising");
      setTimeLeft(8); // 8 seconds to memorise
      setIsReady(false);
    };

    const onResult = (scores) => {
      setResults(scores);
      setGameState("result");
    };

    const onPlayerLeft = (data) => {
      setPlayers((prev) => {
        const newPlayers = { ...prev };
        delete newPlayers[data.userId];
        return newPlayers;
      });
    };

    socket.on("player_ready_status", onPlayerStatusUpdate);
    socket.on("game-started", onGameStarted);
    socket.on("result", onResult);
    socket.on("player_left", onPlayerLeft);

    return () => {
      socket.off("player_ready_status", onPlayerStatusUpdate);
      socket.off("game-started", onGameStarted);
      socket.off("result", onResult);
      socket.off("player_left", onPlayerLeft);
    };
  }, []);

  // client-side timers
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
        setTimeLeft(15); // 15 seconds to guess
      } else if (gameState === "guessing") {
        handleSubmitGuess();
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameState]);

  const handleReadyUp = () => {
    setIsReady(true);
    socket.emit("player_ready", roomId);
  };

  const handleSubmitGuess = () => {
    setGameState("waiting_for_guesses");
    socket.emit("submit_guess", {
      roomId,
      userId: socket.id,
      guess: userHex,
    });
  };

  const handleNextRound = () => {
    setIsReady(false);
    setGameState("waiting_room");
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room", roomId);
    navigate("/lobby");
  };

  return (
    <div className="game-board fade-in">
      <h2 className="game-title">Room: {roomId}</h2>

      {/* Waiting room layout */}
      {gameState === "waiting_room" && (
        <div className="fade-in">
          <h3>Players in Room</h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              textAlign: "left",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            {Object.entries(players).map(([id, player]) => (
              <li
                key={id}
                style={{
                  padding: "5px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <strong>{player.username || "Anonymous"}</strong>
                <span
                  style={{
                    float: "right",
                    color: player.ready ? "#4caf50" : "#ff4800",
                  }}
                >
                  {player.ready ? "Ready" : "Not Ready"}
                </span>
              </li>
            ))}
            {Object.keys(players).length === 0 && <li>Connecting to server</li>}
          </ul>

          <button
            className="action-button"
            onClick={handleReadyUp}
            disabled={isReady}
            style={{ backgroundColor: isReady ? "#555" : "#4caf50" }}
          >
            {isReady ? "Waiting for others" : "Ready"}
          </button>
        </div>
      )}

      {/* Colour showcase */}
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

      {/* Player input */}
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
          <button className="action-button" onClick={handleSubmitGuess}>
            Submit Guess
          </button>
        </div>
      )}

      {/* Waiting for others */}
      {gameState === "waiting_for_guesses" && (
        <div className="fade-in">
          <p>Waiting for other players to submit their guesses</p>
        </div>
      )}

      {/* Result board */}
      {gameState === "result" && results && (
        <div className="fade-in results-container">
          <h3>Round Results</h3>
          <div className="target-result-box">
            <strong>Target Colour</strong>
            <div
              className="result-colour target"
              style={{ backgroundColor: rgbString(targetColour) }}
            />
          </div>

          <div className="guesses-list">
            {Object.entries(results)
              .sort((a, b) => {
                // descending order
                return parseFloat(b[1].score) - parseFloat(a[1].score);
              })
              .map(([id, data]) => (
                <div key={id} className="guess-row">
                  <span className="guess-name">
                    {id === socket.id ? "You" : data.username}
                  </span>
                  <div
                    className="guess-colour-box"
                    style={{ backgroundColor: data.guess }}
                  />
                  <span className="guess-score">
                    {parseFloat(data.score).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>

          <button className="action-button" onClick={handleNextRound}>
            Return to Ready Room
          </button>
        </div>
      )}

      {/* Global leave button */}
      <button className="back-link" onClick={handleLeaveRoom}>
        Back to Menu
      </button>
    </div>
  );
};

export default MultiplayerGame;
