import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ShippingRulesParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface ShippingRulesQuery {
  country?: QueryScalar;
  status?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface ShippingRulesBody {
  baseRate?: unknown;
  cities?: unknown;
  codFee?: unknown;
  country?: unknown;
  fragileSurcharge?: unknown;
  freeShippingAbove?: unknown;
  from?: unknown;
  heavySurcharge?: unknown;
  maxWeight?: unknown;
  minWeight?: unknown;
  name?: unknown;
  perKgRate?: unknown;
  pincodeRanges?: unknown;
  states?: unknown;
  status?: unknown;
  to?: unknown;
  volumetricDivisor?: unknown;
  [key: string]: unknown;
}

export interface ShippingRulesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ShippingRulesRequestShape {
  params: ShippingRulesParams;
  query: ShippingRulesQuery;
  body: ShippingRulesBody;
}

export type ShippingRulesRequest = Request<
  ShippingRulesParams,
  unknown,
  ShippingRulesBody,
  ShippingRulesQuery
> &
  ShippingRulesRequestContext;

export interface ShippingRulesEntity {
  [key: string]: unknown;
}

export interface ShippingRulesServiceInput {
  [key: string]: unknown;
}

export type ShippingRulesServiceResult<T = unknown> = ServiceResult<T>;

export interface ShippingRulesRepoFilter {
  [key: string]: unknown;
}

export interface ShippingRulesRepoUpdate {
  [key: string]: unknown;
}

export interface ShippingRulesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ShippingRuleStatus = 'active' | 'inactive';

export interface PincodeRange {
  from: string;
  to: string;
}

export interface ShippingRuleRecord {
  _id: string;
  name: string;
  country?: string;
  states?: string[];
  cities?: string[];
  pincodeRanges?: PincodeRange[];
  baseRate: number;
  perKgRate?: number;
  minWeight?: number;
  maxWeight?: number;
  freeShippingAbove?: number;
  codFee?: number;
  fragileSurcharge?: number;
  heavySurcharge?: number;
  volumetricDivisor?: number;
  status: ShippingRuleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingRuleInput {
  name: string;
  baseRate: number;
  country?: string;
  perKgRate?: number;
  freeShippingAbove?: number;
  codFee?: number;
}

