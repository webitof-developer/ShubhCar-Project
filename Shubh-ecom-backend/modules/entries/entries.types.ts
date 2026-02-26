import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface EntriesServiceInput {
  [key: string]: unknown;
}

export type EntriesServiceResult<T = unknown> = ServiceResult<T>;

export interface EntriesRepoFilter {
  [key: string]: unknown;
}

export interface EntriesRepoUpdate {
  [key: string]: unknown;
}

export interface EntriesValidatorInput {
  [key: string]: unknown;
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

