import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface TaxParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface TaxQuery {
  hsnCode?: QueryScalar;
  status?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface TaxBody {
  hsnCode?: unknown;
  maxAmount?: unknown;
  minAmount?: unknown;
  rate?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

export interface TaxRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface TaxRequestShape {
  params: TaxParams;
  query: TaxQuery;
  body: TaxBody;
}

export type TaxRequest = Request<TaxParams, unknown, TaxBody, TaxQuery> &
  TaxRequestContext;

export interface TaxEntity {
  [key: string]: unknown;
}

export interface TaxServiceInput {
  [key: string]: unknown;
}

export type TaxServiceResult<T = unknown> = ServiceResult<T>;

export interface TaxRepoFilter {
  [key: string]: unknown;
}

export interface TaxRepoUpdate {
  [key: string]: unknown;
}

export interface TaxValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type TaxSlabStatus = 'active' | 'inactive';

export interface TaxSlabRecord {
  _id: string;
  hsnCode: string;
  name: string;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
  status: TaxSlabStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaxSlabInput {
  hsnCode: string;
  name: string;
  rate: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface UpdateTaxSlabInput {
  name?: string;
  rate?: number;
  status?: TaxSlabStatus;
}

