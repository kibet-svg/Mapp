const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get all public chat rooms
router.get('/rooms', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    const query = { type: 'public', isActive: true };
    
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const rooms = await ChatRoom.find(query)
      .populate('admins', 'username avatar')
      .populate('members.user', 'username avatar')
      .select('-messages') // Don't include messages in room list
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await ChatRoom.countDocuments(query);

    res.json({
      rooms: rooms.map(room => ({
        ...room.toObject(),
        memberCount: room.members.length,
        lastActivity: room.updatedAt
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRooms: total
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ message: 'Server error fetching chat rooms' });
  }
});

// Get user's joined rooms
router.get('/rooms/my', authMiddleware, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      'members.user': req.user._id,
      isActive: true
    })
      .populate('admins', 'username avatar')
      .populate('members.user', 'username avatar')
      .select('-messages')
      .sort({ updatedAt: -1 })
      .exec();

    res.json({
      rooms: rooms.map(room => ({
        ...room.toObject(),
        memberCount: room.members.length,
        lastActivity: room.updatedAt,
        userRole: room.members.find(m => m.user._id.toString() === req.user._id.toString())?.role
      }))
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error fetching user rooms' });
  }
});

// Get a specific chat room with messages
router.get('/rooms/:id', authMiddleware, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate('admins', 'username avatar')
      .populate('members.user', 'username avatar')
      .populate('messages.sender', 'username avatar')
      .exec();

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is a member (for private rooms)
    if (room.type === 'private') {
      const isMember = room.members.some(
        member => member.user._id.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied to this chat room' });
      }
    }

    // Get recent messages (last 50)
    const recentMessages = room.messages.slice(-50);

    res.json({
      ...room.toObject(),
      messages: recentMessages,
      memberCount: room.members.length,
      userRole: room.members.find(m => m.user._id.toString() === req.user._id.toString())?.role || 'guest'
    });
  } catch (error) {
    console.error('Get chat room error:', error);
    res.status(500).json({ message: 'Server error fetching chat room' });
  }
});

// Create a new chat room
router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'public',
      category = 'general',
      maxMembers = 100,
      rules = []
    } = req.body;

    const room = new ChatRoom({
      name,
      description,
      type,
      category,
      maxMembers,
      rules,
      members: [{
        user: req.user._id,
        role: 'admin'
      }],
      admins: [req.user._id]
    });

    await room.save();
    await room.populate('admins', 'username avatar');
    await room.populate('members.user', 'username avatar');

    res.status(201).json({
      message: 'Chat room created successfully',
      room
    });
  } catch (error) {
    console.error('Create chat room error:', error);
    res.status(500).json({ message: 'Server error creating chat room' });
  }
});

// Join a chat room
router.post('/rooms/:id/join', authMiddleware, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if already a member
    const isMember = room.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this room' });
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ message: 'Chat room is full' });
    }

    room.members.push({
      user: req.user._id,
      role: 'member'
    });

    await room.save();

    res.json({ message: 'Successfully joined the chat room' });
  } catch (error) {
    console.error('Join chat room error:', error);
    res.status(500).json({ message: 'Server error joining chat room' });
  }
});

// Leave a chat room
router.post('/rooms/:id/leave', authMiddleware, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Remove user from members
    room.members = room.members.filter(
      member => member.user.toString() !== req.user._id.toString()
    );

    // Remove from admins if applicable
    room.admins = room.admins.filter(
      admin => admin.toString() !== req.user._id.toString()
    );

    await room.save();

    res.json({ message: 'Successfully left the chat room' });
  } catch (error) {
    console.error('Leave chat room error:', error);
    res.status(500).json({ message: 'Server error leaving chat room' });
  }
});

// Send a message to a chat room
router.post('/rooms/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, type = 'text', fileUrl, fileName } = req.body;
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is a member
    const isMember = room.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!isMember && room.type !== 'public') {
      return res.status(403).json({ message: 'You must be a member to send messages' });
    }

    const message = {
      sender: req.user._id,
      content,
      type,
      fileUrl,
      fileName
    };

    room.messages.push(message);
    
    // Keep only last 1000 messages to prevent memory issues
    if (room.messages.length > 1000) {
      room.messages = room.messages.slice(-1000);
    }

    await room.save();
    await room.populate('messages.sender', 'username avatar');

    const newMessage = room.messages[room.messages.length - 1];

    res.json({
      message: 'Message sent successfully',
      chatMessage: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// Get message history for a room
router.get('/rooms/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check access permissions
    const isMember = room.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (room.type === 'private' && !isMember) {
      return res.status(403).json({ message: 'Access denied to this chat room' });
    }

    // Calculate pagination for messages array
    const totalMessages = room.messages.length;
    const startIndex = Math.max(0, totalMessages - (page * limit));
    const endIndex = Math.max(0, totalMessages - ((page - 1) * limit));
    
    const messages = room.messages.slice(startIndex, endIndex);
    
    // Populate sender information
    await room.populate('messages.sender', 'username avatar');

    res.json({
      messages: messages.reverse(), // Reverse to show newest first
      totalMessages,
      hasMore: startIndex > 0
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

// Update chat room settings (admin only)
router.put('/rooms/:id', authMiddleware, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    // Check if user is an admin
    const isAdmin = room.admins.some(
      admin => admin.toString() === req.user._id.toString()
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update room settings' });
    }

    const { name, description, maxMembers, rules } = req.body;

    const updatedRoom = await ChatRoom.findByIdAndUpdate(
      req.params.id,
      { name, description, maxMembers, rules },
      { new: true, runValidators: true }
    ).populate('admins', 'username avatar')
     .populate('members.user', 'username avatar');

    res.json({
      message: 'Chat room updated successfully',
      room: updatedRoom
    });
  } catch (error) {
    console.error('Update chat room error:', error);
    res.status(500).json({ message: 'Server error updating chat room' });
  }
});

module.exports = router;