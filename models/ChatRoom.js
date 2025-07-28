const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }]
}, {
  timestamps: true
});

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  category: {
    type: String,
    enum: ['general', 'jobs', 'marketplace', 'tech', 'design', 'business', 'other'],
    default: 'general'
  },
  avatar: {
    type: String,
    default: ''
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  maxMembers: {
    type: Number,
    default: 100
  },
  rules: [{
    type: String
  }]
}, {
  timestamps: true
});

chatRoomSchema.index({ name: 'text', description: 'text' });
chatRoomSchema.index({ type: 1, category: 1 });
chatRoomSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);