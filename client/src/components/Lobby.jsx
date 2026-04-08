import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

const Lobby = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    // save username and password
    localStorage.setItem("username", username);
    localStorage.setItem("roomPassword", password);

    socket.emit("join_room", { username, roomId, password }, (res) => {
      if (res.status === "OK") {
        navigate(`/multiplayer/${roomId}`);
      } else {
        alert("Failed to join: " + res.message);
      }
    });
  };

  const handleCreate = () => {
    if (!roomId || !password)
      return alert("Please enter a Room Name and Password");

    localStorage.setItem("username", username);
    localStorage.setItem("roomPassword", password);

    socket.emit("create_room", { username, roomId, password }, (res) => {
      if (res.status === "OK") {
        navigate(`/multiplayer/${roomId}`);
      } else {
        alert("Failed to create room.");
      }
    });
  };

  return (
    <div className="game-board fade-in">
      <h2 className="game-title">Multiplayer Lobby</h2>
      <div className="lobby-inputs">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="room-input"
        />
        <input
          type="text"
          placeholder="Room Name"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="room-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="room-input"
        />
        <button className="action-button" onClick={handleJoin}>
          Join Existing Room
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="action-button secondary" onClick={handleCreate}>
          Create New Room
        </button>
      </div>
      <button className="back-link" onClick={() => navigate("/")}>
        Back to Menu
      </button>
    </div>
  );
};

export default Lobby;
