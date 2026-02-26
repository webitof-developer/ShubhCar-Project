const Product = require('../../models/Product.model');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination } = require('../../utils/pagination');

type ProductFilter = Record<string, unknown> & {
  _id?: { $lt: string };
  status?: string;
  categoryId?: string;
  manufacturerBrand?: string;
  productType?: { $in: string[] };
  $or?: unknown[];
  $and?: unknown[];
  isFeatured?: boolean;
};

type UpdateOptions = Record<string, unknown>;

class ProductRepository {
  findById(id, session) {
    const query = Product.findById(id);
    if (session) query.session(session);
    return query.lean();
  }

  // IMPORTANT: for uniqueness check, do NOT filter by status
  findAnyBySlug(slug) {
    return Product.findOne({ slug }).lean();
  }

  findBySlugActive(slug) {
    return Product.findOne({ slug, status: 'active' }).lean();
  }

  findByIdActive(id) {
    return Product.findOne({ _id: id, status: 'active' }).lean();
  }

  listByCategory(categoryId, { limit = 20, cursor }) {
    const query: ProductFilter = { categoryId, status: 'active' };
    if (cursor) query._id = { $lt: cursor };
    const { limit: safeLimit } = getOffsetPagination({ limit });
    return Product.find(query).sort({ _id: -1 }).limit(safeLimit).lean();
  }

  listFeatured({ limit = 20, cursor }) {
    const query: ProductFilter = { isFeatured: true, status: 'active' };
    if (cursor) query._id = { $lt: cursor };
    const { limit: safeLimit } = getOffsetPagination({ limit });
    return Product.find(query).sort({ _id: -1 }).limit(safeLimit).lean();
  }

  async listPublic({
    page = 1,
    limit = 20,
    search,
    categoryId,
    manufacturerBrand,
    productType,
    minPrice,
    maxPrice,
    sort = 'created_desc',
  }) {
    const filter: ProductFilter = { status: 'active' };
    if (categoryId) filter.categoryId = categoryId;
    if (manufacturerBrand) filter.manufacturerBrand = manufacturerBrand;
    if (productType) {
      const types = String(productType)
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean)
        .map((t) => (t === 'AFTERMARKET' ? 'AFTERMARKET' : 'OEM'));
      if (types.length) filter.productType = { $in: types };
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { manufacturerBrand: { $regex: safeSearch, $options: 'i' } },
        { vehicleBrand: { $regex: safeSearch, $options: 'i' } },
        { oemNumber: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      ];
    }
    if (minPrice != null || maxPrice != null) {
      const min = minPrice != null ? Number(minPrice) : 0;
      const max = maxPrice != null ? Number(maxPrice) : null;
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          {
            'retailPrice.salePrice': {
              $gte: min,
              ...(max != null ? { $lte: max } : {}),
            },
          },
          {
            'retailPrice.mrp': {
              $gte: min,
              ...(max != null ? { $lte: max } : {}),
            },
          },
        ],
      });
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      created_desc: { createdAt: -1 },
      created_asc: { createdAt: 1 },
      price_asc: { 'retailPrice.mrp': 1 },
      price_desc: { 'retailPrice.mrp': -1 },
    };

    const { limit: safeLimit, skip } = getOffsetPagination({ page, limit });

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sortMap[sort] || sortMap.created_desc)
        .limit(safeLimit)
        .skip(skip)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { items, total, page: skip / safeLimit + 1, limit: safeLimit };
  }

  create(data) {
    return Product.create(data);
  }

  updateById(id, data, options: UpdateOptions = {}) {
    return Product.findByIdAndUpdate(id, { $set: data }, { new: true })
      .setOptions(options)
      .lean();
  }
  async adminList({ filter = {}, limit = 20, page = 1, includeDeleted = false, projection = null }) {
    const { limit: safeLimit, page: safePage, skip } = getOffsetPagination({
      page,
      limit,
    });
    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(projection || undefined)
        .setOptions({ includeDeleted })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .skip(skip)
        .lean(),
      Product.countDocuments(filter).setOptions({ includeDeleted }),
    ]);
    return { products, total, page: safePage, limit: safeLimit };
  }

  async getStatusCounts() {
    const [active, draft, trashed] = await Promise.all([
      Product.countDocuments({ status: 'active', isDeleted: false }),
      Product.countDocuments({ status: 'draft', isDeleted: false }),
      Product.countDocuments({ isDeleted: true }).setOptions({ includeDeleted: true }),
    ]);
    return {
      all: active + draft,
      active,
      draft,
      trashed,
    };
  }
  forceDelete(id) {
    return Product.findByIdAndDelete(id).setOptions({ includeDeleted: true }).lean();
  }

  removeAllTrashed() {
    return Product.deleteMany({ isDeleted: true }).setOptions({ includeDeleted: true });
  }
}

module.exports = new ProductRepository();

