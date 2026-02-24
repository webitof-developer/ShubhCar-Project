const Wishlist = require('../../models/Wishlist.model');
const { getOffsetPagination } = require('../../utils/pagination');

class WishlistRepo {
  findByUser(userId, pagination = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Wishlist.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  countByUser(userId) {
    return Wishlist.countDocuments({ userId });
  }

  findOne(userId, productId) {
    return Wishlist.findOne({ userId, productId }).lean();
  }

  add(userId, productId) {
    return Wishlist.create({ userId, productId });
  }

  remove(userId, productId) {
    return Wishlist.findOneAndDelete({ userId, productId }).lean();
  }
}

module.exports = new WishlistRepo();
