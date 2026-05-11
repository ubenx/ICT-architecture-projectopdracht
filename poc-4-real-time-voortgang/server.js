const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const progress = {};

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit("progress:snapshot", progress);

  socket.on("student:progress", (update) => {
    const enrichedUpdate = {
      studentId: update.studentId,
      levelId: update.levelId,
      status: update.status,
      score: update.score,
      receivedAt: new Date().toISOString(),
    };

    progress[update.studentId] = enrichedUpdate;

    console.log("Progress update received:", enrichedUpdate);

    io.emit("progress:update", enrichedUpdate);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("Progress server running on port 3000");
});
