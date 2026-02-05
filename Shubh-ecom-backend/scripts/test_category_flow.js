require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category.model');
const categoryService = require('../modules/categories/categories.service');
const cache = require('../cache/category.cache');
const { performance } = require('perf_hooks');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ecom');
    console.log('Connected to DB');

    // 1. Clean verify state
    const testSlug = 'test-category-automation';
    await Category.deleteOne({ slug: testSlug });
    // cache clears handled by service or manually via script
    // const { deleteByPattern } = require('../cache/cacheUtils');
    // await deleteByPattern('catalog:categories:*');

    // 2. Fetch roots (should be cached as empty or partial list)
    console.log('Fetching roots (1st time)...');
    let roots = await categoryService.getRootCategories();
    console.log(`Roots count: ${roots.length}`);
    
    // 3. Create new category
    console.log('Creating new root category...');
    const created = await categoryService.createCategory({
      name: 'Test Category Automation',
      slug: testSlug,
      isActive: true
    });
    console.log('Created:', created._id);

    // 4. Fetch roots again - SHOULD contain new one
    console.log('Fetching roots (2nd time)...');
    roots = await categoryService.getRootCategories();
    const found = roots.find(r => r.slug === testSlug);
    if (found) {
        console.log('PASS: New category found in roots.');
    } else {
        console.log('FAIL: New category NOT found in roots.');
        console.log('Roots slugs:', roots.map(r => r.slug));
    }

    // 5. Update category
    console.log('Updating category name...');
    await categoryService.updateCategory(created._id, { name: 'Test Cat Updated' });

    // 6. Fetch roots again
    console.log('Fetching roots (3rd time)...');
    roots = await categoryService.getRootCategories();
    const updated = roots.find(r => r.slug === testSlug);
    if (updated && updated.name === 'Test Cat Updated') {
        console.log('PASS: Update reflected in roots.');
    } else {
        console.log('FAIL: Update NOT reflected.');
        if(updated) console.log('Current name:', updated.name);
    }

    // Clean up
    await Category.deleteOne({ slug: testSlug });
    // cache cleaned by service delete logic ideally, or:
    // await cache.del('catalog:categories:roots');

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    // Redis disconnect might be needed if cache keeps it open, but script will exit
    process.exit(0);
  }
}

test();
