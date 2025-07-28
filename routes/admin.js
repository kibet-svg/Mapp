const express = require('express');
const User = require('../models/User');
const Job = require('../models/Job');
const Product = require('../models/Product');
const ChatRoom = require('../models/ChatRoom');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Middleware to check admin role
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking admin privileges' });
  }
};

// Dashboard stats
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ isAvailable: true });
    
    const totalChatRooms = await ChatRoom.countDocuments();
    const activeChatRooms = await ChatRoom.countDocuments({ isActive: true });
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentJobs = await Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentProducts = await Product.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        suspended: suspendedUsers,
        banned: bannedUsers,
        recent: recentUsers
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        recent: recentJobs
      },
      products: {
        total: totalProducts,
        available: availableProducts,
        recent: recentProducts
      },
      chatRooms: {
        total: totalChatRooms,
        active: activeChatRooms
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// Get all users with pagination and filtering
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      verified,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    if (status) query.status = status;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (role) query.role = role;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .populate('verifiedBy', 'username')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalUsers: total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get specific user details
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('verifiedBy', 'username email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's activity stats
    const jobsPosted = await Job.countDocuments({ postedBy: user._id });
    const productsPosted = await Product.countDocuments({ seller: user._id });
    const roomsCreated = await ChatRoom.countDocuments({ admins: user._id });

    res.json({
      user,
      stats: {
        jobsPosted,
        productsPosted,
        roomsCreated
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// Verify/Unverify user
router.patch('/users/:userId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = isVerified;
    if (isVerified) {
      user.verifiedAt = new Date();
      user.verifiedBy = req.user._id;
    } else {
      user.verifiedAt = null;
      user.verifiedBy = null;
    }

    await user.save();

    res.json({
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error updating user verification' });
  }
});

// Update user status (suspend/ban/activate)
router.patch('/users/:userId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, suspensionReason, suspendDays } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own status
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    user.status = status;

    if (status === 'suspended' && suspendDays) {
      user.suspendedUntil = new Date(Date.now() + suspendDays * 24 * 60 * 60 * 1000);
      user.suspensionReason = suspensionReason;
    } else {
      user.suspendedUntil = null;
      user.suspensionReason = null;
    }

    await user.save();

    res.json({
      message: `User status updated to ${status}`,
      user: {
        id: user._id,
        username: user.username,
        status: user.status,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// Delete user
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete user's content
    await Job.deleteMany({ postedBy: user._id });
    await Product.deleteMany({ seller: user._id });
    
    // Remove user from chat rooms
    await ChatRoom.updateMany(
      { 'members.user': user._id },
      { $pull: { members: { user: user._id }, admins: user._id } }
    );

    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User and associated content deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// Create test users
router.post('/test-users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { count = 10 } = req.body;

    const testUsers = [];
    const names = [
      'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown',
      'Frank Miller', 'Grace Taylor', 'Henry Anderson', 'Ivy Thomas', 'Jack White',
      'Karen Garcia', 'Leo Martinez', 'Maya Rodriguez', 'Noah Lewis', 'Olivia Clark'
    ];
    
    const skills = [
      ['JavaScript', 'React', 'Node.js'],
      ['Python', 'Django', 'Data Science'],
      ['Java', 'Spring', 'Microservices'],
      ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
      ['Digital Marketing', 'SEO', 'Social Media'],
      ['Project Management', 'Agile', 'Scrum'],
      ['Data Analysis', 'SQL', 'Tableau'],
      ['Mobile Development', 'React Native', 'Flutter'],
      ['DevOps', 'AWS', 'Docker'],
      ['Sales', 'Customer Relations', 'CRM']
    ];

    const locations = [
      'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
      'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Miami, FL',
      'Atlanta, GA', 'Portland, OR', 'Phoenix, AZ', 'Philadelphia, PA'
    ];

    for (let i = 0; i < Math.min(count, names.length); i++) {
      const name = names[i];
      const firstName = name.split(' ')[0].toLowerCase();
      const lastName = name.split(' ')[1].toLowerCase();
      
      const userData = {
        username: `${firstName}_${lastName}`,
        email: `${firstName}.${lastName}@example.com`,
        password: 'testpassword123',
        bio: `I'm ${name}, a passionate professional looking to connect and grow in my career.`,
        location: locations[i % locations.length],
        skills: skills[i % skills.length],
        isVerified: Math.random() > 0.5, // 50% chance of being verified
        status: 'active'
      };

      const user = new User(userData);
      await user.save();
      
      testUsers.push({
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      });
    }

    res.json({
      message: `${testUsers.length} test users created successfully`,
      users: testUsers
    });
  } catch (error) {
    console.error('Create test users error:', error);
    res.status(500).json({ message: 'Server error creating test users' });
  }
});

// Get recent activity
router.get('/activity', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get recent users
    const recentUsers = await User.find({ role: 'user' })
      .select('username email createdAt isVerified status')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent jobs
    const recentJobs = await Job.find()
      .select('title company createdAt')
      .populate('postedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent products
    const recentProducts = await Product.find()
      .select('title price.amount createdAt isService')
      .populate('seller', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      recentUsers,
      recentJobs,
      recentProducts
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error fetching recent activity' });
  }
});

// Get system logs (simplified)
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // This is a simplified version. In a real app, you'd have a logging system
    const logs = [
      {
        id: 1,
        timestamp: new Date(),
        level: 'info',
        action: 'User login',
        details: 'User alice_johnson logged in successfully',
        ip: '192.168.1.100'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 300000),
        level: 'warning',
        action: 'Failed login',
        details: 'Multiple failed login attempts for user@example.com',
        ip: '192.168.1.101'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 600000),
        level: 'info',
        action: 'Job posted',
        details: 'New job "Frontend Developer" posted by TechCorp',
        ip: '192.168.1.102'
      }
    ];

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error fetching logs' });
  }
});

// Promote user to admin
router.patch('/users/:userId/promote', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({ message: 'Server error promoting user' });
  }
});

module.exports = router;