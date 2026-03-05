const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom';
    await mongoose.connect(mongoUri);
    console.error('Connected to MongoDB');

    console.error('Attempting to start session...');
    try {
        const session = await mongoose.startSession();
        console.error('Session started successfully!');
        console.error('Session ID:', session.id);
        
        console.error('Ending session...');
        await session.endSession();
        console.error('Session ended.');
    } catch (e) {
        console.error('Failed to start session:', e.message);
    }

  } catch (error) {
    console.error('CRASHED!');
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
