const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  try {
    console.log('Connecting...');
    const uri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB!');
    
    const User = require('./models/User.model');
    console.log('User model loaded');
    
    const count = await User.countDocuments({});
    console.log(`Total users in DB: ${count}`);
    
    const adminExists = await User.findOne({ email: 'admin@spareparts.com' });
    console.log(`Admin exists: ${!!adminExists}`);
    
    await mongoose.disconnect();
    console.log('Test complete!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
