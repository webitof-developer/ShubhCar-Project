interface PaginationQuery {
  page?: number | string;
  limit?: number | string;
  from?: string | Date;
  to?: string | Date;
  threshold?: number | string;
}
