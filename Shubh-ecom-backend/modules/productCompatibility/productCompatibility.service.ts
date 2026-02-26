const repo = require('./productCompatibility.repo');
const { error } = require('../../utils/apiResponse');

const normalizeVehicleId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (value.vehicleId !== undefined) return normalizeVehicleId(value.vehicleId);
    if (value._id !== undefined) return normalizeVehicleId(value._id);
    if (value.id !== undefined) return normalizeVehicleId(value.id);
  }
  return '';
};

const normalizeVehicleIds = (items: unknown[] = []) =>
  items
    .map((item) => normalizeVehicleId(item))
    .filter(Boolean);

class ProductCompatibilityService {
  async getByProduct(productId) {
    const doc = await repo.findByProduct(productId);
    if (!doc) {
      return { productId, vehicleIds: [] };
    }
    if (!Array.isArray(doc.vehicleIds) && Array.isArray(doc.fits)) {
      const vehicleIds = normalizeVehicleIds(
        doc.fits.map((fit) => fit?.vehicleId),
      );
      if (vehicleIds.length) {
        const updated = await repo.upsert(productId, vehicleIds);
        return updated || { productId, vehicleIds };
      }
      return { productId, vehicleIds: [] };
    }
    return { productId, vehicleIds: normalizeVehicleIds(doc.vehicleIds || []) };
  }

  async upsert(productId, payload) {
    if (!Array.isArray(payload.vehicleIds)) {
      error('vehicleIds must be an array', 400);
    }
    const normalized = normalizeVehicleIds(payload.vehicleIds);
    const uniqueIds = Array.from(new Set(normalized));
    return repo.upsert(productId, uniqueIds);
  }
}

module.exports = new ProductCompatibilityService();

