import type { UserAddressesRequestShape } from './userAddresses.types';
const UserAddress = require('../../models/UserAddress.model');
const { getOffsetPagination } = require('../../utils/pagination');

class UserAddressesRepo {
  create(data) {
    return UserAddress.create(data);
  }

  listByUser(userId, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return UserAddress.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  countByUser(userId) {
    return UserAddress.countDocuments({ userId });
  }

  findById(id) {
    return UserAddress.findById(id).lean();
  }

  update(id, data) {
    return UserAddress.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  remove(id) {
    return UserAddress.findByIdAndDelete(id).lean();
  }
}

module.exports = new UserAddressesRepo();
