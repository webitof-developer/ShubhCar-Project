const Tag = require('../../models/Tag.model');
const slugify = require('slugify');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class TagService {
    async list({ limit, page, search }) {
        const filter = {};
        if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
        const pagination = getOffsetPagination({ page, limit });

        const tags = await Tag.find(filter)
            .sort({ name: 1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        const total = await Tag.countDocuments(filter);
        return {
            tags,
            total,
            page: pagination.page,
            limit: pagination.limit,
            data: tags,
            pagination: buildPaginationMeta({ ...pagination, total }),
        };
    }

    async create(data) {
        if (!data.slug) data.slug = slugify(data.name, { lower: true });
        return Tag.create(data);
    }

    async update(id, data) {
        if (data.name && !data.slug) data.slug = slugify(data.name, { lower: true });
        return Tag.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return Tag.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }
}

module.exports = new TagService();
