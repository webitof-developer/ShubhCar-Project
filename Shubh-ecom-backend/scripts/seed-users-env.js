require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
};

// Users to seed
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@spareparts.com',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    customerType: 'retail',
  },
  {
    firstName: 'Vendor',
    lastName: 'User',
    email: 'vendor@spareparts.com',
    password: 'Vendor@123',
    role: ROLES.VENDOR,
    customerType: 'retail',
  },
  {
    firstName: 'Customer',
    lastName: 'User',
    email: 'customer@spareparts.com',
    password: 'Customer@123',
    role: ROLES.CUSTOMER,
    customerType: 'retail',
  },
  {
    firstName: 'Wholesale',
    lastName: 'User',
    email: 'wholesale@spareparts.com',
    password: 'Wholesale@123',
    role: ROLES.CUSTOMER,
    customerType: 'wholesale',
  }
];

// Helper to hash password (duplicating utils/password.js)
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to DB: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Internal URI: ${mongoUri.substring(0, 20)}...`);

    // Define simplified inline schema to bypass model middleware issues
    // Explicitly map to 'users' collection
    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      authProvider: String,
      passwordHash: String,
      role: String,
      customerType: String,
      verificationStatus: String,
      emailVerified: Boolean,
      phoneVerified: Boolean,
      status: String,
      lastLoginAt: Date,
      sessions: Array,
      loginAttempts: Number,
      lockUntil: Date,
      resetPassword: Object,
      isDeleted: Boolean,
      deletedAt: Date
    }, { collection: 'users', timestamps: true });

    // Prevent overwriting model if already exists (unlikely in script)
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    console.log('🧹 Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Users collection cleared.');

    console.log('\n🌱 Starting seed...');

    for (const user of users) {
      console.log(`Checking existing user: ${user.email}`);
      // Check for existing user
      const existing = await User.findOne({ email: user.email });
      if (existing) {
        console.log(`⏭️  Skipped: ${user.email} (already exists)`);
        continue;
      }

      console.log(`Hashing password for: ${user.email}`);
      // Hash password
      const passwordHash = await hashPassword(user.password);

      console.log(`Creating user in DB: ${user.email}`);
      // Create new user
      // Removed API restrictions/validation, just direct DB insert
      await User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash: passwordHash,
        role: user.role,
        customerType: user.customerType || 'retail',
        authProvider: 'password', // Standard provider
        emailVerified: true, // Auto-verify for seeded users
        phoneVerified: false,
        status: 'active', // Auto-activate
        verificationStatus: 'approved', // Auto-approve
        loginAttempts: 0,
        sessions: [],
        isDeleted: false // REQUIRED for backend model filter
      });

      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('\n✨ Seeding process completed.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`ERROR: ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

seed();
