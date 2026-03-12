require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('../../models/InvoiceSchema.ts');
const Order = require('../../models/Order.model.ts');
const Payment = require('../../models/Payment.model.ts');

const BATCH_SIZE = 100;

const getMongoUri = () =>
  process.env.MONGO_URI || process.env.MONGO_REPLICA_URI || process.env.DATABASE_URL;

const hasSnapshot = (snapshot = {}) =>
  Boolean(snapshot?.paymentMethod || snapshot?.transactionId || snapshot?.gatewayOrderId || snapshot?.paymentId);

async function buildPaymentSnapshot(order) {
  const orderPaymentSnapshot = order?.paymentSnapshot || {};
  const paymentMethod = String(order?.paymentMethod || '').toLowerCase();
  const latestPayment = orderPaymentSnapshot.paymentId
    ? await Payment.findById(orderPaymentSnapshot.paymentId).lean().catch(() => null)
    : await Payment.findOne({ orderId: order?._id }).sort({ createdAt: -1 }).lean().catch(() => null);
  const latestCodEntry = Array.isArray(order?.codPayments) && order.codPayments.length
    ? order.codPayments[order.codPayments.length - 1]
    : null;

  return {
    paymentMethod: order?.paymentMethod || null,
    gateway: latestPayment?.paymentGateway || orderPaymentSnapshot.gateway || null,
    paymentId: latestPayment?._id || orderPaymentSnapshot.paymentId || null,
    gatewayOrderId: latestPayment?.gatewayOrderId || orderPaymentSnapshot.gatewayOrderId || null,
    transactionId: latestPayment?.transactionId || orderPaymentSnapshot.transactionId || null,
    status: order?.paymentStatus || latestPayment?.status || orderPaymentSnapshot.status || null,
    capturedAt:
      orderPaymentSnapshot.updatedAt ||
      latestCodEntry?.createdAt ||
      latestPayment?.updatedAt ||
      latestPayment?.createdAt ||
      null,
    manualReference: paymentMethod === 'cod' ? String(latestCodEntry?.note || '').trim() || null : null,
  };
}

async function backfillInvoicePaymentSnapshots() {
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error('MONGO_URI, MONGO_REPLICA_URI, or DATABASE_URL must be set');
  }

  console.error('Starting invoice payment snapshot backfill...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.error(`Connected to MongoDB: ${mongoose.connection.name}`);

  const query = {
    $or: [
      { paymentSnapshot: { $exists: false } },
      { 'paymentSnapshot.paymentMethod': { $exists: false } },
      { status: { $exists: false } },
    ],
  };

  const total = await Invoice.countDocuments(query);
  if (!total) {
    console.error('No invoices require payment snapshot backfill.');
    return;
  }

  console.error(`Found ${total} invoice documents to review.`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  while (processed < total) {
    const invoices = await Invoice.find(query).sort({ createdAt: 1 }).limit(BATCH_SIZE);
    if (!invoices.length) break;

    for (const invoice of invoices) {
      processed += 1;
      const update = {};

      if (!invoice.status) {
        update.status = 'issued';
      }

      if (!hasSnapshot(invoice.paymentSnapshot)) {
        if (invoice.type === 'credit_note' && invoice.relatedInvoiceId) {
          const relatedInvoice = await Invoice.findById(invoice.relatedInvoiceId).lean().catch(() => null);
          if (hasSnapshot(relatedInvoice?.paymentSnapshot)) {
            update.paymentSnapshot = relatedInvoice.paymentSnapshot;
          }
        }

        if (!update.paymentSnapshot) {
          const order = await Order.findById(invoice.orderId).lean().catch(() => null);
          if (order) {
            update.paymentSnapshot = await buildPaymentSnapshot(order);
          }
        }
      }

      if (Object.keys(update).length) {
        await Invoice.updateOne({ _id: invoice._id }, { $set: update });
        updated += 1;
      } else {
        skipped += 1;
      }

      if (processed % 50 === 0) {
        console.error(`Progress: ${processed}/${total}`);
      }
    }
  }

  console.error('Backfill summary');
  console.error(`Processed: ${processed}`);
  console.error(`Updated: ${updated}`);
  console.error(`Skipped: ${skipped}`);
}

console.error('Warning: this migration updates invoice documents in MongoDB.');
console.error('Make sure you have a recent backup before running it.');

if (process.argv.includes('--confirm')) {
  backfillInvoicePaymentSnapshots()
    .catch((error) => {
      console.error('Migration failed:', error.message || error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect().catch(() => null);
      console.error('Disconnected from MongoDB');
    });
} else {
  console.error('Migration not run. Add --confirm flag to proceed:');
  console.error('  node scripts/migrations/backfill-invoice-payment-snapshots.js --confirm');
}
