const axios = require('axios').default || require('axios');

const API_URL = 'http://localhost:5000';

const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@spareparts.com',
    password: 'Admin@123',
    role: 'admin',
    customerType: 'retail',
  },
  {
    firstName: 'Vendor',
    lastName: 'Demo',
    email: 'vendor@spareparts.com',
    password: 'Vendor@123',
    role: 'vendor',
    customerType: 'retail',
  },
  {
    firstName: 'Customer',
    lastName: 'Demo',
    email: 'customer@spareparts.com',
    password: 'Customer@123',
    role: 'customer',
    customerType: 'retail',
  },
];

async function seedViaAPI() {
  console.log('🌱 Seeding users via API...\n');
  
  let created = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, user, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log(`✅ Created: ${user.email} (${user.role})`);
      created++;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⏭️  Skipped: ${user.email} (already exists)`);
        skipped++;
      } else {
        console.error(`❌ Failed: ${user.email}`, error.response?.data?.message || error.message);
      }
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${users.length}`);
  console.log('\n✨ Seeding completed!\n');
}

seedViaAPI().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
