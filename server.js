require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};

io.on("connection", (socket) => {
  socket.on("join room", (roomID) => {
    users[socket.id] = {
      id: socket.id,
      busy: false,
      caller: null,
    };

    Object.keys(users).map((user) => {
      if (users[user].id !== socket.id && !users[user].busy) {
        socket.emit("all users", [users[user]]);
        users[socket.id].caller = users[user].id;
        users[users[user].id].caller = socket.id;
      }
    });
  });

  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
    users[socket.id].busy = true;
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
    users[socket.id].busy = true;
  });

  socket.on("disconnect", () => {
    // current user
    const user = socket.id;
    delete users[user];

    // caller
    if (users[socket.id] && users[socket.id].caller) {
      const caller = users[socket.id].caller;
      users[caller].busy = false;
      users[caller].caller = null;
    }
  });
});

server.listen(process.env.PORT || 8000, () =>
  console.log("server is running on port 8000")
);
