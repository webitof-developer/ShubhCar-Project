import type { BrandsRequestShape } from './brands.types';
const Brand = require('../../models/Brand.model');
const slugify = require('slugify');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class BrandService {
    async list({ limit, page, search, type }) {
        const filter: any = {};
        if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
        if (type) filter.type = type;
        const pagination = getOffsetPagination({ page, limit });

        const brands = await Brand.find(filter)
            .sort({ name: 1 })
            .skip(pagination.skip)
            .limit(pagination.limit);
        const total = await Brand.countDocuments(filter);
        return {
            brands,
            total,
            page: pagination.page,
            limit: pagination.limit,
            data: brands,
            pagination: buildPaginationMeta({ ...pagination, total }),
        };
    }

    async create(data) {
        if (!data.slug) data.slug = slugify(data.name, { lower: true });
        return Brand.create(data);
    }

    async get(id) {
        return Brand.findById(id);
    }

    async update(id, data) {
        if (data.name && !data.slug) data.slug = slugify(data.name, { lower: true });
        return Brand.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return Brand.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}

module.exports = new BrandService();
