require('dotenv').config();
const { deleteByPattern } = require('../cache/cacheUtils');

async function clear() {
  try {
    console.log('Clearing ALL category keys (old and new)...');
    await deleteByPattern('categories:*'); // Old style
    await deleteByPattern('catalog:categories:*'); // New style
    console.log('Done.');
  } catch (e) {
    console.error(e);
  }
}
clear();
