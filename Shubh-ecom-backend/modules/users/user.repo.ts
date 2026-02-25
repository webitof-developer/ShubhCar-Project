import type { UsersRequestShape } from './users.types';
const User = require('../../models/User.model');
const { getOffsetPagination } = require('../../utils/pagination');

/**
 * USER REPOSITORY
 * ---------------
 * Rules:
 * - All read methods return plain objects (lean)
 * - All write methods return plain objects (lean)
 * - Document access is EXPLICIT
 */
class UserRepository {
  /* =======================
     CREATE
  ======================== */
  async create(data) {
    const doc = await User.create(data);
    return doc.toObject();
  }

  /* =======================
     READ (LEAN ONLY)
  ======================== */
  findById(id) {
    return User.findById(id).lean();
  }

  findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  findByPhone(phone) {
    return User.findOne({ phone }).lean();
  }

  findWholesaleById(id) {
    return User.findOne({
      _id: id,
      customerType: 'wholesale',
    }).lean();
  }

  findPendingWholesale(pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return User.find({
      customerType: 'wholesale',
      verificationStatus: 'pending',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  countPendingWholesale() {
    return User.countDocuments({
      customerType: 'wholesale',
      verificationStatus: 'pending',
    });
  }

  /* =======================
     UPDATE (LEAN RETURN)
  ======================== */
  async updateById(id, data) {
    return User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /* =======================
     DOCUMENT ACCESS (EXPLICIT)
     Use ONLY when you must mutate instance methods
  ======================== */
  findDocById(id) {
    return User.findById(id); // returns mongoose document
  }

  findDocByEmail(email) {
    return User.findOne({ email }).select('+passwordHash');
  }

  findDocByPhone(phone) {
    return User.findOne({ phone }).select('+passwordHash');
  }

  async createUser(data) {
    const doc = await User.create(data);
    return doc.toObject();
  }

  list(filter: any = {}, { limit = 20, page = 1 } = {}) {
    const { limit: safeLimit, skip } = getOffsetPagination({ page, limit });

    return User.find(filter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip(skip)
      .lean();
  }

  listAll(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return User.countDocuments(filter);
  }

  async softDelete(id) {
    return User.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    ).lean();
  }
}

module.exports = new UserRepository();
