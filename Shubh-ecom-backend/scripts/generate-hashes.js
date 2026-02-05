const bcrypt = require('bcrypt');

// Admin password hash for: Admin@123
async function createHash() {
  const hash = await bcrypt.hash('Admin@123', 10);
  console.log('Admin@123 hash:', hash);
  
  const vendorHash = await bcrypt.hash('Vendor@123', 10);
  console.log('Vendor@123 hash:', vendorHash);
  
  const customerHash = await bcrypt.hash('Customer@123', 10);
  console.log('Customer@123 hash:', customerHash);
}

createHash();
