const ProductVariant = require('../../models/ProductVariant.model');
const InventoryLog = require('../../models/InventoryLog.model');

class ProductVariantRepository {
  getVariantById(id) {
    return ProductVariant.findById(id).lean();
  }

  createInventoryLog(log) {
    return InventoryLog.create(log);
  }
}

module.exports = new ProductVariantRepository();
