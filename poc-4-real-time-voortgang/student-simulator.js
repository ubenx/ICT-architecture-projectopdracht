const { io } = require("socket.io-client");

const socket = io("http://server:3000");

const students = ["alice", "bob", "charlie"];
const levels = ["level-1", "level-2", "level-3"];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomScore() {
  return Math.floor(Math.random() * 41) + 60;
}

socket.on("connect", () => {
  console.log("Student simulator connected");

  setInterval(() => {
    const update = {
      studentId: randomItem(students),
      levelId: randomItem(levels),
      status: "completed",
      score: randomScore(),
    };

    console.log("Sending progress:", update);
    socket.emit("student:progress", update);
  }, 3000);
});
