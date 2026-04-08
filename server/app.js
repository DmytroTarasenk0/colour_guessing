import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);

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

const calculateScore = (target, guess) => {
  const maxDist = Math.sqrt(Math.pow(255, 2) * 3);
  const dist = Math.sqrt(
    Math.pow(target.r - guess.r, 2) +
      Math.pow(target.g - guess.g, 2) +
      Math.pow(target.b - guess.b, 2),
  );
  const percentage = Math.max(0, 100 - (dist / maxDist) * 100);
  return percentage;
};

const allowedOrigins = [
  "http://localhost:5173", // local dev
  process.env.CLIENT_URL, // global app
];
// setup Socket.IO server with CORS settings to allow requests from client
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// --- SERVER MEMORY ---
/*  
{
[roomId]: {
  players: {
    [userId1]: {
      username: username,
      score: 0, 
      guess: null,
      ready: true
    }, 
    [userId2]: {
      username: username,
      score: 0, 
      guess: null,
      ready: false
    }, ...
  },
  targetColour: { r: 255, g: 0, b: 0 },
  password: "password",
}
[roomId2]: { etc... }
}
*/
const activeRooms = {};

// server-radio
io.on("connection", (socket) => {
  console.log(`New radio tuned in: ${socket.id}`);

  // cleanup helper
  const removePlayerFromRooms = (socketId) => {
    for (const roomId in activeRooms) {
      const room = activeRooms[roomId];

      if (room.players[socketId]) {
        delete room.players[socketId]; // delete player

        if (Object.keys(room.players).length === 0) {
          delete activeRooms[roomId]; // delete empty room (last user left)
          console.log(`Room ${roomId} deleted.`);
        } else {
          // tell the remaining players to update UI
          io.to(roomId).emit("player_ready_status", room.players);
        }
        break; // stop searching once found
      }
    }
  };

  // lobby channels

  socket.on("join_room", (data, callback) => {
    // join room with prided id and password. If incorrect - Error
    const { username, roomId, password } = data;

    if (roomId in activeRooms) {
      if (activeRooms[roomId].password !== password) {
        callback({ status: "ERROR", message: "Incorrect password" });
      } else {
        socket.join(roomId);

        activeRooms[roomId].players[socket.id] = {
          username: username,
          score: 0,
          guess: null,
          ready: false,
        };

        callback({ status: "OK" });
        io.to(roomId).emit("player_ready_status", activeRooms[roomId].players); // tell everyone that a new player joined
      }
    } else {
      callback({ status: "ERROR", message: "Room does not exist" });
    }
  });

  socket.on("create_room", (data, callback) => {
    // create a room with user input and join
    const { username, roomId, password } = data;

    activeRooms[roomId] = {
      players: {
        [socket.id]: {
          username: username,
          score: 0,
          guess: null,
          ready: false,
        },
      },
      targetColour: null,
      password: password,
    };
    socket.join(roomId);
    callback({ status: "OK" });
    // UI update
    io.to(roomId).emit("player_ready_status", activeRooms[roomId].players);
  });

  // player "back to menu"
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    removePlayerFromRooms(socket.id);
  });

  // gameplay channels

  socket.on("player_ready", (roomId) => {
    const room = activeRooms[roomId];

    if (!room || !room.players[socket.id]) return;

    // mark player as ready
    room.players[socket.id].ready = true;

    // ready-check
    const playersArray = Object.values(room.players);
    const allReady = playersArray.every((player) => player.ready === true);

    // if everyone is ready => start the game automatically
    if (allReady) {
      // reset scores and guesses for the new round
      playersArray.forEach((player) => {
        player.score = 0;
        player.guess = null;
        player.ready = false; // and ready state for the next round
      });

      // generate the target colour
      const randomColour = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      };

      room.targetColour = randomColour;

      // send colour
      io.to(roomId).emit("game-started", randomColour);
      // tell the room that everyone is un-ready
      io.to(roomId).emit("player_ready_status", room.players);
    } else {
      // tell the room who is ready so the UI can update
      io.to(roomId).emit("player_ready_status", room.players);
    }
  });

  socket.on("submit_guess", (data) => {
    const { roomId, userId, guess } = data;

    const room = activeRooms[roomId];

    // save user guess
    room.players[userId].guess = guess;

    // calculate user score
    const userScore = calculateScore(room.targetColour, hexToRgb(guess));
    room.players[userId].score = userScore;

    // check if all players guessed
    const playerIds = Object.keys(room.players);
    const allGuessed = playerIds.every((id) => room.players[id].guess !== null);

    if (allGuessed) {
      // send data
      io.to(roomId).emit("result", room.players);
    }
  });

  // disconnect (reload/close page)
  socket.on("disconnect", () => {
    console.log(`Radio disconnected: ${socket.id}`);
    removePlayerFromRooms(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
