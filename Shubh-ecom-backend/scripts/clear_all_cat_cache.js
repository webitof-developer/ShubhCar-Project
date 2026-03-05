require('dotenv').config();
const { deleteByPattern } = require('../cache/cacheUtils');

async function clear() {
  try {
    console.error('Clearing ALL category keys (old and new)...');
    await deleteByPattern('categories:*'); // Old style
    await deleteByPattern('catalog:categories:*'); // New style
    console.error('Done.');
  } catch (e) {
    console.error(e);
  }
}
clear();
