// @ts-nocheck
const Product = require('../../models/Product.model');
const ProductCompatibility = require('../../models/ProductCompatibility.model');
const Vehicle = require('../vehicle-management/models/Vehicle.model');
const VehicleYear = require('../vehicle-management/models/VehicleYear.model');
const productService = require('./products.service');
const { getOffsetPagination } = require('../../utils/pagination');
const { escapeRegex } = require('../../utils/escapeRegex');
const elastic = require('../../lib/elasticsearch');
const logger = require('../../config/logger');

const PRODUCT_TYPE_ALLOWLIST = new Set(['OEM', 'OES', 'AFTERMARKET']);

const parseCsvValues = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseVehicleIds = (value) => parseCsvValues(value);
const parseYears = (value) =>
  parseCsvValues(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

const parseProductTypes = (value) =>
  parseCsvValues(value)
    .map((item) => item.toUpperCase())
    .filter((item) => PRODUCT_TYPE_ALLOWLIST.has(item));

const toFacetBuckets = (input = []) =>
  input
    .map((item) => {
      if (item?.key != null) {
        return {
          key: String(item.key),
          label: item.label != null ? String(item.label) : String(item.key),
          count: item.count || 0,
        };
      }
      if (item?._id != null && item._id !== '') {
        return {
          key: String(item._id),
          label: String(item._id),
          count: item.count || 0,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);

const sortMapMongo = {
  relevance: { createdAt: -1 },
  created_desc: { createdAt: -1 },
  created_asc: { createdAt: 1 },
  price_asc: { 'retailPrice.mrp': 1 },
  price_desc: { 'retailPrice.mrp': -1 },
};

const sortMapElastic = {
  relevance: [{ _score: 'desc' }, { createdAt: 'desc' }],
  created_desc: [{ createdAt: 'desc' }],
  created_asc: [{ createdAt: 'asc' }],
  price_asc: [{ 'retailPrice.mrp': 'asc' }],
  price_desc: [{ 'retailPrice.mrp': 'desc' }],
};

const enrichItemsForStorefront = async (items = [], user, referenceNow) => {
  if (!items.length) return [];
  const rated = await Promise.all(
    items.map((item) => productService.attachAggregateRatings(item)),
  );
  const withImages = await productService.attachImages(rated);
  const withDeals = productService.applyFlashDealWindowList(
    withImages,
    referenceNow,
  );
  return productService.applyPricingList(withDeals, user);
};

const buildMongoFilter = ({
  query,
  categoryIds,
  manufacturerBrands,
  vehicleBrands,
  productTypes,
  vehicleProductIds,
}) => {
  const filter = {
    status: 'active',
  };

  if (categoryIds.length === 1) filter.categoryId = categoryIds[0];
  if (categoryIds.length > 1) filter.categoryId = { $in: categoryIds };
  if (manufacturerBrands.length) filter.manufacturerBrand = { $in: manufacturerBrands };
  if (vehicleBrands.length) filter.vehicleBrand = { $in: vehicleBrands };
  if (productTypes.length) filter.productType = { $in: productTypes };
  if (Array.isArray(vehicleProductIds)) {
    filter._id = vehicleProductIds.length
      ? { $in: vehicleProductIds }
      : { $in: [] };
  }

  if (query) {
    const safe = escapeRegex(query);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { manufacturerBrand: { $regex: safe, $options: 'i' } },
      { vehicleBrand: { $regex: safe, $options: 'i' } },
      { oemNumber: { $regex: safe, $options: 'i' } },
      { oesNumber: { $regex: safe, $options: 'i' } },
      { sku: { $regex: safe, $options: 'i' } },
      { tags: { $in: [new RegExp(safe, 'i')] } },
    ];
  }

  return filter;
};

const buildMongoFacets = async (filter) => {
  const matchingProductIds = await Product.find(filter).select('_id').lean();
  const productIds = matchingProductIds.map((item) => item._id);

  const [productTypes, manufacturerBrands, vehicleBrands, categories, years] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $group: { _id: '$productType', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: filter },
      { $group: { _id: '$manufacturerBrand', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: filter },
      { $group: { _id: '$vehicleBrand', count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: filter },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          key: { $toString: '$_id' },
          label: { $ifNull: ['$category.name', 'Unknown category'] },
          count: 1,
        },
      },
    ]),
    productIds.length
      ? ProductCompatibility.aggregate([
          { $match: { productId: { $in: productIds } } },
          { $unwind: '$vehicleIds' },
          {
            $lookup: {
              from: 'vehicles',
              localField: 'vehicleIds',
              foreignField: '_id',
              as: 'vehicle',
            },
          },
          { $unwind: '$vehicle' },
          {
            $lookup: {
              from: 'vehicleyears',
              localField: 'vehicle.yearId',
              foreignField: '_id',
              as: 'yearDoc',
            },
          },
          { $unwind: '$yearDoc' },
          { $group: { _id: '$yearDoc.year', count: { $sum: 1 } } },
        ])
      : [],
  ]);

  return {
    productTypes: toFacetBuckets(productTypes),
    manufacturerBrands: toFacetBuckets(manufacturerBrands),
    vehicleBrands: toFacetBuckets(vehicleBrands),
    categories: toFacetBuckets(categories),
    years: toFacetBuckets(years),
  };
};

const resolveVehicleProductIds = async ({ vehicleIds = [], years = [] } = {}) => {
  if (!vehicleIds.length && !years.length) return null;

  let effectiveVehicleIds = vehicleIds.map((item) => String(item));

  if (years.length) {
    const yearDocs = await VehicleYear.find({ year: { $in: years } })
      .select('_id')
      .lean();
    if (!yearDocs.length) return [];

    const yearIds = yearDocs.map((doc) => doc._id);
    const yearVehicles = await Vehicle.find({ yearId: { $in: yearIds } })
      .select('_id')
      .lean();
    const yearVehicleIds = yearVehicles.map((doc) => String(doc._id));

    if (!yearVehicleIds.length) return [];

    if (effectiveVehicleIds.length) {
      const yearSet = new Set(yearVehicleIds);
      effectiveVehicleIds = effectiveVehicleIds.filter((id) => yearSet.has(String(id)));
    } else {
      effectiveVehicleIds = yearVehicleIds;
    }
  }

  if (!effectiveVehicleIds.length) return [];

  const rows = await ProductCompatibility.find({
    vehicleIds: { $in: effectiveVehicleIds },
  })
    .select('productId')
    .lean();

  return rows.map((row) => row.productId);
};

const searchViaElastic = async ({
  query,
  page,
  limit,
  categoryIds,
  manufacturerBrands,
  vehicleBrands,
  productTypes,
  vehicleIds,
  vehicleProductIds,
  sort,
}) => {
  if (!elastic.isEnabled()) return null;

  const client = elastic.getClient();
  const index = elastic.getProductsIndex();
  const from = (page - 1) * limit;

  const filters = [{ term: { status: 'active' } }];
  if (categoryIds.length) filters.push({ terms: { categoryId: categoryIds } });
  if (manufacturerBrands.length) {
    filters.push({ terms: { 'manufacturerBrand.keyword': manufacturerBrands } });
  }
  if (vehicleBrands.length) {
    filters.push({ terms: { 'vehicleBrand.keyword': vehicleBrands } });
  }
  if (productTypes.length) filters.push({ terms: { productType: productTypes } });
  if (vehicleIds.length) filters.push({ terms: { vehicleIds: vehicleIds } });
  if (Array.isArray(vehicleProductIds)) {
    if (!vehicleProductIds.length) return { ids: [], total: 0 };
    filters.push({
      ids: {
        values: vehicleProductIds.map((id) => String(id)),
      },
    });
  }

  const must = query
    ? [
        {
          multi_match: {
            query,
            type: 'best_fields',
            fields: [
              'name^4',
              'manufacturerBrand^3',
              'vehicleBrand^3',
              'oemNumber^5',
              'oesNumber^5',
              'sku^2',
              'tags^2',
              'categoryName^1.5',
            ],
            fuzziness: 'AUTO',
          },
        },
      ]
    : [{ match_all: {} }];

  const response = await client.search({
    index,
    from,
    size: limit,
    track_total_hits: true,
    query: {
      bool: {
        must,
        filter: filters,
      },
    },
    sort: sortMapElastic[sort] || sortMapElastic.relevance,
  });

  const hits = response?.hits?.hits || [];
  const ids = hits.map((hit) => String(hit?._id)).filter(Boolean);
  const total = Number(response?.hits?.total?.value || 0);

  return { ids, total };
};

const loadByIdsPreservingOrder = async (ids = []) => {
  if (!ids.length) return [];
  const docs = await Product.find({
    _id: { $in: ids },
    status: 'active',
  }).lean();
  const map = new Map(docs.map((doc) => [String(doc._id), doc]));
  return ids.map((id) => map.get(String(id))).filter(Boolean);
};

const searchCatalog = async (queryInput = {}, user) => {
  const query = String(queryInput.q || queryInput.search || '').trim();
  const sort = String(queryInput.sort || 'relevance');
  const categoryIds = parseCsvValues(queryInput.categoryId);
  const manufacturerBrands = parseCsvValues(queryInput.manufacturerBrand);
  const vehicleBrands = parseCsvValues(queryInput.vehicleBrand);
  const productTypes = parseProductTypes(queryInput.productType);
  const vehicleIds = parseVehicleIds(queryInput.vehicle_id);
  const years = parseYears(queryInput.year);
  const { page, limit } = getOffsetPagination({
    page: queryInput.page || 1,
    limit: queryInput.limit || 20,
  });

  const referenceNow = await productService.resolveFlashDealNow();
  const vehicleProductIds = await resolveVehicleProductIds({ vehicleIds, years });
  const mongoFilter = buildMongoFilter({
    query,
    categoryIds,
    manufacturerBrands,
    vehicleBrands,
    productTypes,
    vehicleProductIds,
  });

  let items = [];
  let total = 0;
  let usedElastic = false;

  const shouldUseElastic = query.length > 0;

  if (shouldUseElastic) {
    try {
      const elasticResult = await searchViaElastic({
        query,
        page,
        limit,
        categoryIds,
        manufacturerBrands,
        vehicleBrands,
        productTypes,
        vehicleIds,
        vehicleProductIds,
        sort,
      });
      if (elasticResult) {
        usedElastic = true;
        items = await loadByIdsPreservingOrder(elasticResult.ids);
        total = elasticResult.total;
      }
    } catch (err) {
      logger.warn('catalog_search_elastic_failed', {
        error: err?.message || String(err),
      });
    }
  }

  if (!usedElastic) {
    const skip = (page - 1) * limit;
    const [mongoItems, mongoTotal] = await Promise.all([
      Product.find(mongoFilter)
        .sort(sortMapMongo[sort] || sortMapMongo.relevance)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(mongoFilter),
    ]);
    items = mongoItems;
    total = mongoTotal;
  }

  const facets = await buildMongoFacets(mongoFilter);
  const enrichedItems = await enrichItemsForStorefront(items, user, referenceNow);

  return {
    items: enrichedItems,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    facets,
  };
};

module.exports = {
  searchCatalog,
};
