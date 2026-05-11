const { io } = require("socket.io-client");

const socket = io("http://server:3000");

socket.on("connect", () => {
  console.log("Teacher dashboard connected");
  console.log("Waiting for real-time progress updates...");
});

socket.on("progress:snapshot", (snapshot) => {
  console.log("Initial progress snapshot:", snapshot);
});

socket.on("progress:update", (update) => {
  console.log("Live progress update received:", update);
});
