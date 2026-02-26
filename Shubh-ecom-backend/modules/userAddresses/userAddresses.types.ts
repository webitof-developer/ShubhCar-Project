import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface UserAddressesParams {
  id?: string;
  userId?: string;
  [key: string]: string | undefined;
}

export interface UserAddressesQuery {
  [key: string]: QueryScalar | unknown;
}

export interface UserAddressesBody {
  city?: unknown;
  fullName?: unknown;
  line1?: unknown;
  phone?: unknown;
  postalCode?: unknown;
  state?: unknown;
  [key: string]: unknown;
}

export interface UserAddressesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface UserAddressesRequestShape {
  params: UserAddressesParams;
  query: UserAddressesQuery;
  body: UserAddressesBody;
}

export type UserAddressesRequest = Request<
  UserAddressesParams,
  unknown,
  UserAddressesBody,
  UserAddressesQuery
> &
  UserAddressesRequestContext;

export interface UserAddressesEntity {
  [key: string]: unknown;
}

export interface UserAddressesServiceInput {
  [key: string]: unknown;
}

export type UserAddressesServiceResult<T = unknown> = ServiceResult<T>;

export interface UserAddressesRepoFilter {
  [key: string]: unknown;
}

export interface UserAddressesRepoUpdate {
  [key: string]: unknown;
}

export interface UserAddressesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface AddressRecord {
  _id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  label?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface UpdateAddressInput {
  fullName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  label?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

