const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/shubh-ecom').then(async () => {
  const db = mongoose.connection.db;
  const items = await db.collection('cartitems').find().limit(5).toArray();
  console.log('Sample Cart Items:');
  console.log(JSON.stringify(items, null, 2));

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
