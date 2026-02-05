// Usage: node scripts/migrate-notifications-audience.js
// Ensures older notifications get an audience of "user" and backfills readAt for read items.
const { connectMongo, disconnectMongo } = require('../config/mongo');
const Notification = require('../models/Notification.model');

async function run() {
  await connectMongo();

  const audienceResult = await Notification.updateMany(
    { $or: [{ audience: { $exists: false } }, { audience: null }] },
    { $set: { audience: 'user' } },
  );

  const readAtResult = await Notification.updateMany(
    {
      status: 'read',
      $or: [{ readAt: { $exists: false } }, { readAt: null }],
    },
    { $set: { readAt: new Date() } },
  );

  // eslint-disable-next-line no-console
  console.info('Migration complete', {
    audienceUpdated: audienceResult.modifiedCount,
    readAtUpdated: readAtResult.modifiedCount,
  });

  await disconnectMongo();
  process.exit(0);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed', err);
  disconnectMongo().finally(() => process.exit(1));
});
