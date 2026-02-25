import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface TagsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface TagsQuery {
  limit?: QueryScalar;
  page?: QueryScalar;
  search?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface TagsBody {
  name?: unknown;
  slug?: unknown;
  [key: string]: unknown;
}

export interface TagsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface TagsRequestShape {
  params: TagsParams;
  query: TagsQuery;
  body: TagsBody;
}

export type TagsRequest = Request<
  TagsParams,
  unknown,
  TagsBody,
  TagsQuery
> & TagsRequestContext;

export interface TagsEntity {
  [key: string]: any;
}

export interface TagsServiceInput {
  [key: string]: any;
}

export type TagsServiceResult<T = any> = Promise<T>;

export interface TagsRepoFilter {
  [key: string]: any;
}

export interface TagsRepoUpdate {
  [key: string]: any;
}

export interface TagsValidatorInput {
  [key: string]: any;
}

export interface TagRecord {
  _id: string;
  name: string;
  slug: string;
  isDeleted: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ListTagsQuery extends TagsQuery {
  limit?: number | string;
  page?: number | string;
  search?: string;
}

export interface CreateTagInput {
  name: string;
  slug?: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
}

export interface TagsPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListTagsResult {
  tags: TagRecord[];
  total: number;
  page: number;
  limit: number;
  data: TagRecord[];
  pagination: TagsPaginationMeta;
}
