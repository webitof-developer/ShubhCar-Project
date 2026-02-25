import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface VendorsServiceInput {
  [key: string]: any;
}

export type VendorsServiceResult<T = any> = Promise<T>;

export interface VendorsRepoFilter {
  [key: string]: any;
}

export interface VendorsRepoUpdate {
  [key: string]: any;
}

export interface VendorsValidatorInput {
  [key: string]: any;
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
