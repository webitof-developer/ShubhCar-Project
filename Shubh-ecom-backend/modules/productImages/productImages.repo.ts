import type { ProductImagesRequestShape } from './productImages.types';
const ProductImage = require('../../models/ProductImage.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ProductImagesRepo {
  create(data) {
    return ProductImage.create(data);
  }

  findById(id) {
    return ProductImage.findById(id).lean();
  }

  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return ProductImage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return ProductImage.countDocuments(filter);
  }

  update(id, data) {
    return ProductImage.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async remove(id) {
    const found = await ProductImage.findById(id);
    if (!found) return null;
    return ProductImage.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), isPrimary: false },
      { new: true },
    ).lean();
  }
}

module.exports = new ProductImagesRepo();
