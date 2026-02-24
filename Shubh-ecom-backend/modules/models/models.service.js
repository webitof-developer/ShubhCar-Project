const Model = require('../../models/Model.model');
const slugify = require('slugify');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class ModelService {
    async list({ limit, page, search }) {
        const filter = {};
        if (search) filter.year = { $regex: escapeRegex(search), $options: 'i' };
        const pagination = getOffsetPagination({ page, limit });

        const models = await Model.find(filter)
            .sort({ year: -1 }) // Sort by year descending (newest first)
            .skip(pagination.skip)
            .limit(pagination.limit);
        const total = await Model.countDocuments(filter);
        return {
            models,
            total,
            page: pagination.page,
            limit: pagination.limit,
            data: models,
            pagination: buildPaginationMeta({ ...pagination, total }),
        };
    }

    async create(data) {
        if (!data.slug && data.year) {
            data.slug = slugify(data.year, { lower: true });
        }
        return Model.create(data);
    }

    async get(id) {
        return Model.findById(id);
    }

    async update(id, data) {
        if (data.year && !data.slug) {
            data.slug = slugify(data.year, { lower: true });
        }
        return Model.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return Model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}

module.exports = new ModelService();
