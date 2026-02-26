const rolesRepo = require('./roles.repo');
const { error } = require('../../utils/apiResponse');
const {
  MAX_LIMIT,
  getOffsetPagination,
  buildPaginationMeta,
} = require('../../utils/pagination');

const DEFAULT_ROLES: Array<Record<string, unknown>> = [
  {
    name: 'Shop Manager',
    slug: 'shop-manager',
    permissions: [
      'dashboard.view',
      'analytics.view',
      'orders.view',
      'orders.create',
      'orders.update',
      'orders.delete',
      'products.view',
      'products.create',
      'products.update',
      'products.delete',
      'customers.view',
      'customers.update',
      'inventory.view',
      'inventory.update',
      'reviews.view',
      'reviews.update',
      'media.view',
      'media.create',
      'entries.view',
      'coupons.view',
    ],
    isSystem: true,
  },
  {
    name: 'Staff',
    slug: 'staff',
    permissions: [
      'dashboard.view',
      'orders.view',
      'products.view',
      'customers.view',
      'reviews.view',
      'media.view',
    ],
    isSystem: true,
  },
  {
    name: 'Salesman',
    slug: 'salesman',
    permissions: [
      'dashboard.view',
      'customers.view',
      'customers.create',
      'orders.view',
      'orders.create',
    ],
    isSystem: true,
  },
];

const normalizeSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

class RolesService {
  async _listAllRoles(filter: Record<string, unknown> = {}) {
    const all: Array<Record<string, unknown>> = [];
    let page = 1;
    while (true) {
      const batch = await rolesRepo.list(filter, { page, limit: MAX_LIMIT });
      if (!batch.length) break;
      all.push(...batch);
      if (batch.length < MAX_LIMIT) break;
      page += 1;
    }
    return all;
  }

  async ensureDefaults() {
    const existing = await this._listAllRoles();
    const existingSlugs = new Set(existing.map((role) => role.slug));

    const missing = DEFAULT_ROLES.filter((role) => !existingSlugs.has(role.slug));
    if (missing.length) {
      await Promise.all(missing.map((role) => rolesRepo.create(role)));
    }

    const systemDefaultsBySlug = new Map(
      DEFAULT_ROLES.map((role) => [role.slug, role]),
    );
    const syncTasks = existing
      .filter((role) => role.isSystem && systemDefaultsBySlug.has(role.slug))
      .map((role) => {
        const defaultRole = systemDefaultsBySlug.get(role.slug);
        if (!defaultRole) return null;
        const currentPermissions = Array.isArray(role.permissions) ? role.permissions : [];
        const targetPermissions = Array.isArray(defaultRole.permissions) ? defaultRole.permissions : [];
        const sameLength = currentPermissions.length === targetPermissions.length;
        const samePermissions = sameLength && targetPermissions.every((perm) => currentPermissions.includes(perm));
        if (samePermissions) return null;
        return rolesRepo.updateById(role._id, {
          permissions: targetPermissions,
        });
      })
      .filter(Boolean);

    if (syncTasks.length) {
      await Promise.all(syncTasks);
    }
  }

  async list(query: Record<string, unknown> = {}) {
    await this.ensureDefaults();
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const [data, total] = await Promise.all([
      rolesRepo.list({}, pagination),
      rolesRepo.count({}),
    ]);
    return {
      roles: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async get(id) {
    const role = await rolesRepo.findById(id);
    if (!role) error('Role not found', 404);
    return role;
  }

  async create(payload) {
    if (!payload?.name) error('Role name is required', 400);
    const slug = normalizeSlug(payload.slug || payload.name);
    if (!slug) error('Role slug is invalid', 400);

    const existingByName = await rolesRepo.findByName(payload.name);
    if (existingByName) error('Role name already exists', 409);

    const existingBySlug = await rolesRepo.findBySlug(slug);
    if (existingBySlug) error('Role slug already exists', 409);

    return rolesRepo.create({
      name: payload.name,
      slug,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      isSystem: false,
    });
  }

  async update(id, payload) {
    const role = await rolesRepo.findById(id);
    if (!role) error('Role not found', 404);
    if (role.isSystem) error('System roles cannot be edited', 400);

    const updateData: Record<string, unknown> = {};
    if (payload.name) {
      updateData.name = payload.name;
      updateData.slug = normalizeSlug(payload.slug || payload.name);
    }
    if (payload.permissions) {
      updateData.permissions = Array.isArray(payload.permissions)
        ? payload.permissions
        : [];
    }

    if (updateData.slug) {
      const existingBySlug = await rolesRepo.findBySlug(updateData.slug);
      if (existingBySlug && String(existingBySlug._id) !== String(id)) {
        error('Role slug already exists', 409);
      }
    }

    return rolesRepo.updateById(id, updateData);
  }

  async remove(id) {
    const role = await rolesRepo.findById(id);
    if (!role) error('Role not found', 404);
    if (role.isSystem) error('System roles cannot be deleted', 400);

    await rolesRepo.deleteById(id);
    return { success: true };
  }
}

module.exports = new RolesService();

