import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface ShippingRulesServiceInput {
  [key: string]: any;
}

export type ShippingRulesServiceResult<T = any> = Promise<T>;

export interface ShippingRulesRepoFilter {
  [key: string]: any;
}

export interface ShippingRulesRepoUpdate {
  [key: string]: any;
}

export interface ShippingRulesValidatorInput {
  [key: string]: any;
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
