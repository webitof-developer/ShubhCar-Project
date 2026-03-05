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
    firstName: 'Customer',
    lastName: 'Demo',
    email: 'customer@spareparts.com',
    password: 'Customer@123',
    role: 'customer',
    customerType: 'retail',
  },
];

async function seedViaAPI() {
  console.error('🌱 Seeding users via API...\n');
  
  let created = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, user, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.error(`✅ Created: ${user.email} (${user.role})`);
      created++;
    } catch (error) {
      if (error.response?.status === 409) {
        console.error(`⏭️  Skipped: ${user.email} (already exists)`);
        skipped++;
      } else {
        console.error(`❌ Failed: ${user.email}`, error.response?.data?.message || error.message);
      }
    }
  }

  console.error('\n📊 Seeding Summary:');
  console.error(`   ✅ Created: ${created}`);
  console.error(`   ⏭️  Skipped: ${skipped}`);
  console.error(`   📝 Total: ${users.length}`);
  console.error('\n✨ Seeding completed!\n');
}

seedViaAPI().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
