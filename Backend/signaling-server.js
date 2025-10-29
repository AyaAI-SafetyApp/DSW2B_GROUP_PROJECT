const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Register user
  socket.on('register', (userId) => {
    users.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Initiate call
  socket.on('call-user', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      socket.to(targetSocketId).emit('incoming-call', {
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        offer: data.offer
      });
      console.log(`Call from ${data.fromUserId} to ${data.targetUserId}`);
    } else {
      socket.emit('call-failed', { message: 'User not available' });
    }
  });

  // Answer call
  socket.on('call-answer', (data) => {
    socket.to(data.to).emit('call-answered', {
      answer: data.answer
    });
  });

  // ICE candidates exchange
  socket.on('ice-candidate', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate: data.candidate
      });
    }
  });

  // End call
  socket.on('end-call', (data) => {
    const targetSocketId = users.get(data.targetUserId);
    if (targetSocketId) {
      socket.to(targetSocketId).emit('call-ended');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});