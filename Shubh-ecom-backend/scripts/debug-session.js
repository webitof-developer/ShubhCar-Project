const mongoose = require('mongoose');
const { createSafeSession } = require('../utils/mongoTransaction');
require('dotenv').config();

// Simple model for testing
const TestSchema = new mongoose.Schema({ name: String });
const TestModel = mongoose.model('TestSessionDebug', TestSchema);

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('Creating safe session...');
    const session = await createSafeSession();
    console.log('Session metadata:', {
      isStandalone: session._isStandalone,
      hasOptions: !!session.options,
      hasTransaction: !!session.transaction,
      hasClient: !!session.client,
      clientMatch: session.client === mongoose.connection.getClient(),
    });

    console.log('Attempting database operation with session...');
    // This calls Model.prototype.save() which eventually calls the driver's insertOne/save
    // passing the session. This is where we expect it to fail.
    await TestModel.create([{ name: 'test' }], { session });

    console.log('Operation successful!');

    if (session._isStandalone) {
      console.log('Clean up fake session');
      session.endSession();
    } else {
      await session.endSession();
    }
  } catch (error) {
    console.error('CRASHED!');
    console.error(error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

run();
