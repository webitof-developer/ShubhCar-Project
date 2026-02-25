import type { TagsRequestShape } from './tags.types';
import type { CreateTagInput, ListTagsQuery, ListTagsResult, TagRecord, UpdateTagInput } from './tags.types';

const Tag = require('../../models/Tag.model');
const slugify = require('slugify');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class TagService {
    async list({ limit, page, search }: ListTagsQuery): Promise<ListTagsResult> {
        const filter: Record<string, unknown> = {};
        if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };
        const pagination = getOffsetPagination({ page, limit });

        const tags = await Tag.find(filter)
            .sort({ name: 1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        const total = await Tag.countDocuments(filter);
        return {
            tags: tags as TagRecord[],
            total,
            page: pagination.page,
            limit: pagination.limit,
            data: tags as TagRecord[],
            pagination: buildPaginationMeta({ ...pagination, total }),
        };
    }

    async create(data: CreateTagInput): Promise<TagRecord> {
        if (!data.slug) data.slug = slugify(data.name, { lower: true });
        return Tag.create(data) as Promise<TagRecord>;
    }

    async update(id: string, data: UpdateTagInput): Promise<TagRecord | null> {
        if (data.name && !data.slug) data.slug = slugify(data.name, { lower: true });
        return Tag.findByIdAndUpdate(id, data, { new: true }) as Promise<TagRecord | null>;
    }

    async delete(id: string): Promise<TagRecord | null> {
        return Tag.findByIdAndUpdate(id, { isDeleted: true }, { new: true }) as Promise<TagRecord | null>;
    }
}

module.exports = new TagService();
