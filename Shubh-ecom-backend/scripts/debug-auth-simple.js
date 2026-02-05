const authController = require('../modules/auth/auth.controller');

// Mock objects
const req = {
  method: 'POST',
  url: '/api/v1/auth/login',
  body: {
    identifier: 'admin@spareparts.com',
    password: 'Admin@123',
  },
  ip: '127.0.0.1',
  headers: {
    'user-agent': 'debug-script'
  }
};

const res = {
  headersSent: false,
  statusCode: 200,
  data: null,
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    return this;
  },
  ok: function(data, message, statusCode, meta) {
    return this.status(statusCode || 200).json({
      success: true,
      data,
      message,
      meta
    });
  },
  fail: function(message, statusCode, code) {
    return this.status(statusCode || 500).json({
      success: false,
      message,
      code
    });
  }
};

// Mock next
const next = (err) => {
  if (err) {
    console.error('Error passed to next:', err);
  } else {
    console.log('Next called successfully');
  }
};

const mongoose = require('mongoose');
require('dotenv').config();

async function runTest() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    console.log('Running login controller...');
    await authController.login(req, res, next);
    
    console.log('Response status:', res.statusCode);
    console.log('Response data:', JSON.stringify(res.data, null, 2));
    
  } catch (err) {
    console.error('Caught error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
