const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    console.error('Connecting...');
    const uri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.error('Connected to MongoDB!');
    
    const User = require('../models/User.model');
    console.error('User model loaded');
    
    const count = await User.countDocuments({});
    console.error(`Total users in DB: ${count}`);
    
    const adminExists = await User.findOne({ email: 'admin@spareparts.com' });
    console.error(`Admin exists: ${!!adminExists}`);
    
    await mongoose.disconnect();
    console.error('Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
