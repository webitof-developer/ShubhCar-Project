const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Attempting to start session...');
    try {
        const session = await mongoose.startSession();
        console.log('Session started successfully!');
        console.log('Session ID:', session.id);
        
        console.log('Ending session...');
        await session.endSession();
        console.log('Session ended.');
    } catch (e) {
        console.log('Failed to start session:', e.message);
    }

  } catch (error) {
    console.error('CRASHED!');
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
