import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface EntriesParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface EntriesQuery {
  endDate?: QueryScalar;
  limit?: QueryScalar;
  page?: QueryScalar;
  search?: QueryScalar;
  startDate?: QueryScalar;
  status?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface EntriesBody {
  email?: unknown;
  message?: unknown;
  name?: unknown;
  phone?: unknown;
  subject?: unknown;
  [key: string]: unknown;
}

export interface EntriesRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface EntriesRequestShape {
  params: EntriesParams;
  query: EntriesQuery;
  body: EntriesBody;
}

export type EntriesRequest = Request<
  EntriesParams,
  unknown,
  EntriesBody,
  EntriesQuery
> &
  EntriesRequestContext;

export interface EntriesEntity {
  [key: string]: any;
}

export interface EntriesServiceInput {
  [key: string]: any;
}

export type EntriesServiceResult<T = any> = Promise<T>;

export interface EntriesRepoFilter {
  [key: string]: any;
}

export interface EntriesRepoUpdate {
  [key: string]: any;
}

export interface EntriesValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ContactEntryStatus = 'new' | 'read' | 'replied' | 'closed';

export interface ContactEntryRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: ContactEntryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitEntryInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}
