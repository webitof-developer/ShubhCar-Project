import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface VendorsParams {
  id?: string;
  owner?: string;
  vendorId?: string;
  [key: string]: string | undefined;
}

export interface VendorsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface VendorsBody {
  accountHolder?: unknown;
  accountNumber?: unknown;
  bankDetails?: unknown;
  bankName?: unknown;
  bannerUrl?: unknown;
  businessName?: unknown;
  description?: unknown;
  docType?: unknown;
  documents?: unknown;
  docUrl?: unknown;
  email?: unknown;
  gstOrTaxId?: unknown;
  ifscOrSwift?: unknown;
  is?: unknown;
  legalName?: unknown;
  logoUrl?: unknown;
  otherwise?: unknown;
  ownerUserId?: unknown;
  paypalEmail?: unknown;
  phone?: unknown;
  rejectionReason?: unknown;
  status?: unknown;
  then?: unknown;
  upiId?: unknown;
  [key: string]: unknown;
}

export interface VendorsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface VendorsRequestShape {
  params: VendorsParams;
  query: VendorsQuery;
  body: VendorsBody;
}

export type VendorsRequest = Request<
  VendorsParams,
  unknown,
  VendorsBody,
  VendorsQuery
> &
  VendorsRequestContext;

export interface VendorsEntity {
  [key: string]: unknown;
}

export interface VendorsServiceInput {
  [key: string]: unknown;
}

export type VendorsServiceResult<T = unknown> = ServiceResult<T>;

export interface VendorsRepoFilter {
  [key: string]: unknown;
}

export interface VendorsRepoUpdate {
  [key: string]: unknown;
}

export interface VendorsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type VendorDocType =
  | 'pan'
  | 'gst'
  | 'business_registration'
  | 'id_proof';

export interface VendorRecord {
  _id: string;
  ownerUserId: string;
  businessName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  gstOrTaxId?: string;
  status: VendorStatus;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVendorInput {
  businessName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  gstOrTaxId?: string;
}

