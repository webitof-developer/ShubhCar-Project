import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface CouponsServiceInput {
  [key: string]: unknown;
}

export type CouponsServiceResult<T = unknown> = ServiceResult<T>;

export interface CouponsRepoFilter {
  [key: string]: unknown;
}

export interface CouponsRepoUpdate {
  [key: string]: unknown;
}

export interface CouponsValidatorInput {
  [key: string]: unknown;
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

