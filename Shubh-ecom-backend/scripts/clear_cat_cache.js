require('dotenv').config();
const cache = require('../cache/category.cache');

async function clear() {
  try {
    console.log('Clearing categories:roots...');
    await cache.del('categories:roots');
    console.log('Done.');
  } catch (e) {
    console.error(e);
  }
}
clear(); // Fire and forget, script outcome doesn't strictly matter if process exits
