import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface CouponsParams {
  id?: string;
  lock?: string;
  [key: string]: string | undefined;
}

export interface CouponsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface CouponsBody {
  code?: unknown;
  discountType?: unknown;
  discountValue?: unknown;
  isActive?: unknown;
  maxDiscountAmount?: unknown;
  minOrderAmount?: unknown;
  orderSubtotal?: unknown;
  usageLimitPerUser?: unknown;
  usageLimitTotal?: unknown;
  userId?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  [key: string]: unknown;
}

export interface CouponsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface CouponsRequestShape {
  params: CouponsParams;
  query: CouponsQuery;
  body: CouponsBody;
}

export type CouponsRequest = Request<
  CouponsParams,
  unknown,
  CouponsBody,
  CouponsQuery
> &
  CouponsRequestContext;

export interface CouponsEntity {
  [key: string]: any;
}

export interface CouponsServiceInput {
  [key: string]: any;
}

export type CouponsServiceResult<T = any> = Promise<T>;

export interface CouponsRepoFilter {
  [key: string]: any;
}

export interface CouponsRepoUpdate {
  [key: string]: any;
}

export interface CouponsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type CouponDiscountType = 'percent' | 'flat';

export interface CouponRecord {
  _id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  usageLimitTotal?: number | null;
  usageLimitPerUser?: number | null;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  validFrom: string | Date;
  validTo: string | Date;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
}

export interface UpdateCouponInput {
  discountValue?: number;
  validFrom?: string | Date;
  validTo?: string | Date;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  isActive?: boolean;
}

export interface ValidateCouponInput {
  code: string;
  userId?: string;
  orderSubtotal: number;
}
