const logger = require('../../config/logger');

const verifyVendorDocuments = async (vendorId) => {
  logger.info(`Queue: verifyVendorDocuments for vendor ${vendorId}`);
};

const vendorStatusChangedNotification = async (vendorId, status) => {
  logger.info(`Queue: vendorStatusChangedNotification for vendor ${vendorId} -> ${status}`);
};

const enqueueListingFeeJob = async (vendorId) => {
  logger.info(`Queue: listingFeeJob for vendor ${vendorId}`);
};

module.exports = {
  verifyVendorDocuments,
  vendorStatusChangedNotification,
  enqueueListingFeeJob,
};

