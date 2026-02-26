import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface UsersParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface UsersQuery {
  customerType?: QueryScalar;
  includeDeleted?: QueryScalar;
  limit?: QueryScalar;
  page?: QueryScalar;
  role?: QueryScalar;
  search?: QueryScalar;
  status?: QueryScalar;
  verificationStatus?: QueryScalar;
  salespersonId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface UsersBody {
  authProvider?: unknown;
  currentPassword?: unknown;
  customerType?: unknown;
  documentUrls?: unknown;
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  newPassword?: unknown;
  otp?: unknown;
  password?: unknown;
  phone?: unknown;
  role?: unknown;
  status?: unknown;
  verificationStatus?: unknown;
  wholesaleInfo?: unknown;
  [key: string]: unknown;
}

export interface UsersRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface UsersRequestShape {
  params: UsersParams;
  query: UsersQuery;
  body: UsersBody;
}

export type UsersRequest = Request<
  UsersParams,
  unknown,
  UsersBody,
  UsersQuery
> &
  UsersRequestContext;

export interface UsersEntity {
  [key: string]: unknown;
}

export interface UsersServiceInput {
  [key: string]: unknown;
}

export type UsersServiceResult<T = unknown> = ServiceResult<T>;

export interface UsersRepoFilter {
  [key: string]: unknown;
}

export interface UsersRepoUpdate {
  [key: string]: unknown;
}

export interface UsersValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'customer' | 'salesman';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type CustomerType = 'retail' | 'wholesale';
export type VerificationStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected';
export type AuthProvider = 'password' | 'google' | 'phone_otp';

export interface WholesaleInfo {
  businessName?: string;
  gstOrTaxId?: string;
  documentUrls?: string[];
  address?: string;
}

export interface UserRecord {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  roleId?: string;
  customerType: CustomerType;
  verificationStatus: VerificationStatus;
  authProvider: AuthProvider;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  wholesaleInfo?: WholesaleInfo;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;
  customerType?: CustomerType;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  customerType?: CustomerType;
  verificationStatus?: VerificationStatus;
}

