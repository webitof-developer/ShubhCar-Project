require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category.model');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom'); // fallback to default local if env not set, but .env should work
    console.log('Connected to DB');

    const all = await Category.find({});
    console.log(`Total categories: ${all.length}`);

    const roots = await Category.find({ parentId: null });
    console.log(`Explicit roots (parentId: null): ${roots.length}`);
    
    roots.forEach(r => {
        console.log(`ROOT: ${r.name} (${r._id}) isActive:${r.isActive}`);
    });

    const activeRoots = await Category.find({ parentId: null, isActive: true });
    console.log(`Active roots: ${activeRoots.length}`);
    
    // Check for "Filter" specifically if it was seen before
    const filter = await Category.findOne({ name: 'Filter' });
    if(filter) console.log('Filter cat:', filter);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

check();
