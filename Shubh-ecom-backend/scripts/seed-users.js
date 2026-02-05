const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');
const ROLES = require('../constants/roles');

// Load environment variables
require('dotenv').config();

const User = require('../models/User.model');

const seedUsers = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@spareparts.com',
    password: 'Admin@123',
    role: ROLES.ADMIN,
    customerType: 'retail',
    authProvider: 'password',
    emailVerified: true,
    phoneVerified: false,
    status: 'active',
    verificationStatus: 'not_required',
  },
  {
    firstName: 'Vendor',
    lastName: 'Demo',
    email: 'vendor@spareparts.com',
    password: 'Vendor@123',
    role: ROLES.VENDOR,
    customerType: 'retail',
    authProvider: 'password',
    emailVerified: true,
    phoneVerified: false,
    status: 'active',
    verificationStatus: 'approved',
  },
  {
    firstName: 'Customer',
    lastName: 'Demo',
    email: 'customer@spareparts.com',
    password: 'Customer@123',
    role: ROLES.CUSTOMER,
    customerType: 'retail',
    authProvider: 'password',
    emailVerified: true,
    phoneVerified: false,
    status: 'active',
    verificationStatus: 'not_required',
  },
  {
    firstName: 'Wholesale',
    lastName: 'Customer',
    email: 'wholesale@spareparts.com',
    password: 'Wholesale@123',
    role: ROLES.CUSTOMER,
    customerType: 'wholesale',
    authProvider: 'password',
    emailVerified: true,
    phoneVerified: false,
    status: 'active',
    verificationStatus: 'approved',
    wholesaleInfo: {
      businessName: 'Demo Wholesale Co.',
      gstOrTaxId: 'GST123456789',
      address: '123 Business St, Commerce City',
    },
  },
];

async function seed() {
  try {
    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGO_REPLICA_URI not found in environment variables');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    
    // Set strictQuery before connecting
    mongoose.set('strictQuery', true);
    
    // Connect with simplified options
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const userData of seedUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email }).lean();

      if (existingUser) {
        console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
        skipped++;
        continue;
      }

      // Hash the password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const { password, ...userDataWithoutPassword } = userData;
      await User.create({
        ...userDataWithoutPassword,
        passwordHash,
      });

      console.log(`✅ Created: ${userData.email} (${userData.role})`);
      created++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${seedUsers.length}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    console.log('✨ Seeding completed successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:');
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the seeder
seed();
