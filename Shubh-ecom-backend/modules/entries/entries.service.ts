const Entry = require('../../models/Entry.model');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

class EntriesService {
    async list({ limit, page, status, startDate, endDate, search }) {
        const filter: {
            status?: string;
            createdAt?: { $gte?: Date; $lte?: Date };
            $or?: Array<Record<string, unknown>>;
        } = {};
        if (status) filter.status = status;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { subject: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const pagination = getOffsetPagination({ page, limit });

        const query = Entry.find(filter)
            .sort({ createdAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit);

        const entries = await query.populate('user', 'name email phone');
        const total = await Entry.countDocuments(filter);

        return {
            entries,
            total,
            page: pagination.page,
            limit: pagination.limit,
            data: entries,
            pagination: buildPaginationMeta({ ...pagination, total }),
        };
    }

    async create(data) {
        return Entry.create(data);
    }

    async get(id) {
        return Entry.findById(id).populate('user', 'name email phone');
    }

    async delete(id) {
        return Entry.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    async markRead(id) {
        return Entry.findByIdAndUpdate(id, { status: 'read' }, { new: true });
    }

    async stats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await Promise.all([
            Entry.countDocuments({ isDeleted: false, createdAt: { $gte: startOfToday } }),
            Entry.countDocuments({ isDeleted: false, createdAt: { $gte: sevenDaysAgo } }),
            Entry.countDocuments({ isDeleted: false, createdAt: { $gte: thirtyDaysAgo } }),
            Entry.countDocuments({ isDeleted: false })
        ]);

        return {
            today: stats[0],
            last7Days: stats[1],
            last30Days: stats[2],
            total: stats[3]
        };
    }
}

module.exports = new EntriesService();

