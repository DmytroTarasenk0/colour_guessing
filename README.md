# Colour Guessing Game (Multiplayer Edition)

A real-time, full-stack multiplayer game where players compete to recreate a target colour from memory. Built with **React** and **Socket.IO**.

## Live Demo

Play the game here: **[Colour Guessing Game](https://colour-guessing-livid.vercel.app/)**

> **Note on Multiplayer:** The backend is hosted on a free Render instance. If the server has been inactive for a long time, it will go to sleep. It may take up to 1 minute for the server to wake up when you first create or join a room.

## Features

- **Solo & Multiplayer Modes:** Practice by yourself or challenge friends in private, real-time rooms.
- **Synchronised Gameplay:** Custom Socket.IO server ensures all players experience the memorisation, guessing, and result phases at the exact same time.
- **Ready-Check System:** The server automatically manages room states, ensuring a round only starts when all players are ready.
- **Scoring System:** Calculates an accuracy percentage based on the exact geometric distance between the target RGB values and the user's guess.
- **Responsive Design:** Fully playable on both desktop and mobile devices.

## Tech Stack

- **Frontend:** React, Vite, React Router, `react-colorful`
- **Backend:** Node.js, Express, Socket.IO
- **Deployment:** Vercel (Frontend), Render (Backend)

## Project Structure

This project uses a "monorepo" structure, meaning the frontend and backend are kept in separate folders within the same repository.

```text
colour_guessing/
   client/       # React Frontend
   server/       # Node.js / Socket.IO Backend
```

## Local Development Setup

To run this game locally, you will need to run **two separate terminal windows** (one for the server, and one for the client).

### 1. Clone the repository

```bash
git clone https://github.com/DmytroTarasenk0/colour_guessing.git
cd colour_guessing
```

### 2. Start the Backend Server (Terminal 1)

```bash
cd server
npm install
node app.js
```

_The server will run on `http://localhost:3000`._

### 3. Start the Frontend Client (Terminal 2)

Open a new terminal window at the root of the project.

```bash
cd client
npm install
npm run dev
```

_The client will run on `http://localhost:5173`._
