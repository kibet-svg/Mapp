const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/chat', require('./routes/chat'));

// Serve static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO for real-time chat
const users = new Map();
const chatRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_user', (userData) => {
    users.set(socket.id, userData);
    socket.broadcast.emit('user_online', userData);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    if (!chatRooms.has(roomId)) {
      chatRooms.set(roomId, new Set());
    }
    chatRooms.get(roomId).add(socket.id);
    socket.to(roomId).emit('user_joined_room', users.get(socket.id));
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    if (chatRooms.has(roomId)) {
      chatRooms.get(roomId).delete(socket.id);
    }
    socket.to(roomId).emit('user_left_room', users.get(socket.id));
  });

  socket.on('send_message', (data) => {
    if (data.roomId) {
      socket.to(data.roomId).emit('receive_message', {
        ...data,
        sender: users.get(socket.id),
        timestamp: new Date()
      });
    } else {
      socket.to(data.recipientId).emit('receive_direct_message', {
        ...data,
        sender: users.get(socket.id),
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_offline', user);
      users.delete(socket.id);
    }
    
    // Remove from all chat rooms
    chatRooms.forEach((roomUsers, roomId) => {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id);
        socket.to(roomId).emit('user_left_room', user);
      }
    });
  });
});

// MongoDB connection (using local MongoDB for simplicity)
mongoose.connect('mongodb://localhost:27017/carya', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('MongoDB connection error (will use in-memory storage):', err.message);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Carya server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});