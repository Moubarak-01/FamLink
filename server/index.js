
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow connection from frontend dev server
    methods: ["GET", "POST"]
  }
});

// WebSocket Event Handling
io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Join a specific room (activity, outing, or 1-on-1 chat)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User with ID: ${socket.id} joined room: ${roomId}`);
  });

  // Leave a room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User with ID: ${socket.id} left room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    // data: { roomId, message: { id, text, senderId, ... } }
    console.log(`Message sent to room ${data.roomId}:`, data.message.text);
    
    // Broadcast the message to everyone in the room EXCEPT the sender
    // (Frontend handles sender's own message optimistically)
    socket.to(data.roomId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User Disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SERVER RUNNING on port ${PORT}`);
});
