const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * MongoDB Transaction Helper
 *
 * Provides graceful transaction support that works in both:
 * - Standalone MongoDB (development): Operations run sequentially without transactions
 * - Replica Set MongoDB (production): Full ACID transaction support
 *
 * This helper automatically detects the MongoDB topology and adjusts behavior accordingly.
 */

let topologyCache: boolean | null = null;
let lastTopologyCheck = 0;
const TOPOLOGY_CHECK_INTERVAL = 60000; // Cache for 1 minute

/**
 * Check if MongoDB is running as a replica set
 * @returns {boolean} True if replica set, false if standalone
 */
function isReplicaSet() {
  const now = Date.now();

  // Use cached value if recent
  if (
    topologyCache !== null &&
    now - lastTopologyCheck < TOPOLOGY_CHECK_INTERVAL
  ) {
    return topologyCache;
  }

  try {
    const topology = mongoose.connection?.client?.topology;
    const type = topology?.description?.type;

    // Valid replica set types
    const replicaSetTypes = ['ReplicaSetWithPrimary', 'ReplicaSetNoPrimary'];
    topologyCache = replicaSetTypes.includes(type);
    lastTopologyCheck = now;

    if (!topologyCache && process.env.NODE_ENV !== 'development') {
      logger.warn(
        'MongoDB is not configured as a replica set in non-development environment',
        {
          topology: type,
          environment: process.env.NODE_ENV,
        },
      );
    }

    return topologyCache;
  } catch (error: any) {
    logger.error('Error detecting MongoDB topology', { error: error.message });
    return false;
  }
}

/**
 * Create a MongoDB session with fallback support
 * @returns {Promise<Object>} Mongoose session object
 */
async function createSafeSession() {
  try {
    const session = await mongoose.startSession();
    // Keep existing call-sites working: standalone skips tx lifecycle,
    // but still uses a real MongoDB session object for DB operations.
    (session as any)._isStandalone = !isReplicaSet();
    return session;
  } catch (error: any) {
    logger.error('Failed to create MongoDB session', { error: error.message });
    throw error;
  }
}

/**
 * Execute a callback within a transaction (or sequentially if standalone)
 *
 * @param {Function} callback - Async function to execute, receives session as parameter
 * @param {Object} options - Transaction options
 * @param {Object} options.context - Logging context (requestId, userId, etc)
 * @returns {Promise<any>} Result from callback
 *
 * @example
 * const result = await withTransaction(async (session) => {
 *   await Model.create([{ name: 'test' }], { session });
 *   return someValue;
 * }, { context: { requestId: '123' } });
 */
async function withTransaction(
  callback: (session: any) => Promise<unknown>,
  options: { context?: Record<string, unknown> } = {},
) {
  const { context = {} } = options;
  const session = await createSafeSession();
  const isStandalone = (session as any)._isStandalone;

  let transactionStarted = false;

  try {
    if (!isStandalone) {
      // Security/compat: MongoDB transactions must use primary read preference.
      session.startTransaction({ readPreference: 'primary' });
      transactionStarted = true;

      logger.debug('Transaction started', {
        ...context,
        sessionId: session.id,
      });
    } else {
      logger.debug('Running without transaction (standalone MongoDB)', context);
    }

    // Execute the callback with session
    const result = await callback(session);

    // Commit transaction if in replica set
    if (!isStandalone && transactionStarted) {
      await session.commitTransaction();
      logger.debug('Transaction committed', {
        ...context,
        sessionId: session.id,
      });
    }

    return result;
  } catch (error: any) {
    // Abort transaction if started
    if (!isStandalone && transactionStarted) {
      try {
        await session.abortTransaction();
        logger.debug('Transaction aborted', {
          ...context,
          sessionId: session.id,
          error: error.message,
        });
      } catch (abortError: any) {
        logger.error('Failed to abort transaction', {
          ...context,
          error: abortError.message,
        });
      }
    }

    // Re-throw the original error
    throw error;
  } finally {
    // Always clean up session
    session.endSession();
  }
}

/**
 * Execute a callback with manual session management
 * Useful when you need more control over transaction lifecycle
 *
 * @param {Function} callback - Async function to execute
 * @returns {Promise<any>} Result from callback
 *
 * @example
 * const result = await withSession(async (session, startTx, commitTx, abortTx) => {
 *   await startTx();
 *   try {
 *     await Model.create([{ name: 'test' }], { session });
 *     await commitTx();
 *     return someValue;
 *   } catch (error) {
 *     await abortTx();
 *     throw error;
 *   }
 * });
 */
async function withSession(
  callback: (
    session: any,
    startTx: () => Promise<void>,
    commitTx: () => Promise<void>,
    abortTx: () => Promise<void>,
  ) => Promise<unknown>,
) {
  const session = await createSafeSession();
  const isStandalone = (session as any)._isStandalone;

  const startTx = async () => {
    if (!isStandalone) {
      // Security/compat: MongoDB transactions must use primary read preference.
      session.startTransaction({ readPreference: 'primary' });
    }
  };

  const commitTx = async () => {
    if (!isStandalone) {
      await session.commitTransaction();
    }
  };

  const abortTx = async () => {
    if (!isStandalone) {
      await session.abortTransaction();
    }
  };

  try {
    const result = await callback(session, startTx, commitTx, abortTx);
    return result;
  } finally {
    session.endSession();
  }
}

/**
 * Check if transactions are supported in current environment
 * @returns {boolean} True if transactions are supported
 */
function supportsTransactions() {
  return isReplicaSet();
}

module.exports = {
  isReplicaSet,
  createSafeSession,
  withTransaction,
  withSession,
  supportsTransactions,
};
