const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toPositiveInt = (value: unknown): number | null => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getOffsetPagination = ({
  page,
  limit,
  defaultPage = DEFAULT_PAGE,
  defaultLimit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT,
}: {
  page?: unknown;
  limit?: unknown;
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
} = {}) => {
  const safePage = toPositiveInt(page) || defaultPage;
  const parsedLimit = toPositiveInt(limit);
  const safeLimit = parsedLimit ? Math.min(parsedLimit, maxLimit) : defaultLimit;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const buildPaginationMeta = ({
  page,
  limit,
  total,
}: {
  page: number;
  limit: number;
  total: unknown;
}) => {
  const safeTotal = Number.isFinite(Number(total)) ? Number(total) : 0;
  return {
    page,
    limit,
    total: safeTotal,
    totalPages: Math.max(1, Math.ceil(safeTotal / limit)),
  };
};

const getPagination = ({
  limit = DEFAULT_LIMIT,
  cursor,
}: {
  limit?: number;
  cursor?: string;
} = {}) => {
  const query: Record<string, unknown> = {};
  if (cursor) {
    query._id = { $lt: cursor };
  }

  return {
    query,
    options: {
      limit: Math.min(limit, MAX_LIMIT),
      sort: { _id: -1 },
    },
  };
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  getOffsetPagination,
  buildPaginationMeta,
  getPagination,
};
