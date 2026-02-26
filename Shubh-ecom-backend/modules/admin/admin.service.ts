const userRepo = require('../users/user.repo');

const { error } = require('../../utils/apiResponse');
const ROLES = require('../../constants/roles');
const { approveWholesaleSchema } = require('./admin.validation');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class AdminService {
  async reviewWholesaleUser(adminUser, userId, payload) {
    if (adminUser.role !== ROLES.ADMIN) {
      error('Unauthorized', 403);
    }

    const { error: err, value } = approveWholesaleSchema.validate(payload);
    if (err) error(err.details[0].message);

    const user = await userRepo.findById(userId);
    if (!user) error('User not found', 404);

    if (user.customerType !== 'wholesale') {
      error('Not a wholesale user', 400);
    }

    if (user.verificationStatus !== 'pending') {
      error('User already reviewed', 409);
    }

    const update: Record<string, unknown> = {};

    if (value.action === 'approve') {
      update.verificationStatus = 'approved';
      update.status = 'active';
    }

    if (value.action === 'reject') {
      update.verificationStatus = 'rejected';
      update.status = 'inactive';
      update.rejectionReason = value.reason;
    }

    return userRepo.updateById(userId, update);
  }

  async listPendingWholesale(query: Record<string, unknown> = {}) {
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });

    const data = await userRepo.findPendingWholesale(pagination);
    const total = typeof userRepo.countPendingWholesale === 'function'
      ? await userRepo.countPendingWholesale()
      : data.length;

    return {
      users: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }
}

module.exports = new AdminService();

