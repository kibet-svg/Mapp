const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carya', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.username);
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@carya.com',
            password: 'admin123', // This will be hashed automatically
            role: 'admin',
            isVerified: true,
            bio: 'Platform Administrator',
            location: 'Carya HQ',
            status: 'active'
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('Username: admin');
        console.log('Email: admin@carya.com');
        console.log('Password: admin123');
        console.log('');
        console.log('Please change the password after first login for security.');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser();