require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User.model');

// Mock password used in seed
const PASSWORD = 'Admin@123';
const EMAIL = 'admin@spareparts.com';

const debug = async () => {
    try {
        console.log('🔌 Connecting to DB...');
        const uri = process.env.MONGO_URI;
        console.log(`🔌 URI: ${uri.substring(0, 25)}...${uri.substring(uri.length - 10)}`);
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ Connected to DB: ${mongoose.connection.name}`);

        
        console.log(`🔍 Finding user: ${EMAIL}`);
        // Explicitly select passwordHash as per User.model definition
        const user = await User.findOne({ email: EMAIL }).select('+passwordHash');
        
        if (!user) {
            console.error('❌ Admin User not found!');
            
            console.log('📋 Listing ALL users:');
            const allUsers = await User.find({}).select('email role');
            allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
            
            process.exit(1);
        }

        console.log('✅ User found.');
        console.log('   ID:', user._id);
        console.log('   Hash present?', !!user.passwordHash);
        
        if (user.passwordHash) {
            console.log('   Hash length:', user.passwordHash.length);
            console.log('   Hash start:', user.passwordHash.substring(0, 10));
        }

        console.log(`🔐 Testing password: ${PASSWORD}`);
        const match = await bcrypt.compare(PASSWORD, user.passwordHash);
        
        if (match) {
            console.log('✅ Password VALID locally.');
        } else {
            console.error('❌ Password INVALID locally.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

debug();
