require('dotenv').config();
const cache = require('../cache/category.cache');

async function clear() {
  try {
    console.error('Clearing categories:roots...');
    await cache.del('categories:roots');
    console.error('Done.');
  } catch (e) {
    console.error(e);
  }
}
clear(); // Fire and forget, script outcome doesn't strictly matter if process exits
