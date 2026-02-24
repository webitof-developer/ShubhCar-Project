const seoRepo = require('./seo.repo');
const { error } = require('../../utils/apiResponse');
const ROLES = require('../../constants/roles');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class SeoService {
  /* =======================
     ADMIN CMS
  ======================== */

  async upsertSeo(payload, user) {
    if (!user || user.role !== ROLES.ADMIN) error('Forbidden', 403);

    const required = ['entityType', 'metaTitle', 'metaDescription'];
    required.forEach((f) => {
      if (!payload[f]) error(`${f} is required`, 400);
    });

    if (payload.entityType !== 'global' && !payload.entityId) {
      error('entityId required for non-global SEO', 400);
    }

    return seoRepo.upsert(
      {
        entityType: payload.entityType,
        entityId: payload.entityId || null,
      },
      {
        ...payload,
        createdBy: user._id,
        isActive: true,
      },
    );
  }

  async listSeo(query = {}) {
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const filter = { isActive: true };

    const [data, total] = await Promise.all([
      seoRepo.list(filter, pagination),
      seoRepo.count(filter),
    ]);

    return {
      records: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async deactivateSeo(id, user) {
    if (!user || user.role !== ROLES.ADMIN) error('Forbidden', 403);
    return seoRepo.deactivate(id);
  }

  /* =======================
     RUNTIME SEO RESOLUTION
     (Used by frontend / SSR)
  ======================== */

  async resolveSeo({ entityType, entityId }) {
    // 1. Try entity-specific SEO
    if (entityType && entityId) {
      const specific = await seoRepo.findOne({
        entityType,
        entityId,
        isActive: true,
      });
      if (specific) return specific;
    }

    // 2. Fallback to global SEO
    const globalSeo = await seoRepo.findOne({
      entityType: 'global',
      isActive: true,
    });

    if (!globalSeo) {
      error('Global SEO not configured', 500);
    }

    return globalSeo;
  }
}

module.exports = new SeoService();
