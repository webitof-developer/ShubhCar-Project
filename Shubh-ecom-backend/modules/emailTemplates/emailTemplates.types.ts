import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface EmailTemplatesParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface EmailTemplatesQuery {
  name?: QueryScalar;
  subject?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface EmailTemplatesBody {
  name?: unknown;
  subject?: unknown;
  [key: string]: unknown;
}

export interface EmailTemplatesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface EmailTemplatesRequestShape {
  params: EmailTemplatesParams;
  query: EmailTemplatesQuery;
  body: EmailTemplatesBody;
}

export type EmailTemplatesRequest = Request<
  EmailTemplatesParams,
  unknown,
  EmailTemplatesBody,
  EmailTemplatesQuery
> &
  EmailTemplatesRequestContext;

export interface EmailTemplatesEntity {
  [key: string]: unknown;
}

export interface EmailTemplatesServiceInput {
  [key: string]: unknown;
}

export type EmailTemplatesServiceResult<T = unknown> = ServiceResult<T>;

export interface EmailTemplatesRepoFilter {
  [key: string]: unknown;
}

export interface EmailTemplatesRepoUpdate {
  [key: string]: unknown;
}

export interface EmailTemplatesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type EmailTemplateTrigger =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'otp'
  | 'password_reset'
  | 'refund'
  | 'welcome';

export interface EmailTemplateRecord {
  _id: string;
  trigger: EmailTemplateTrigger;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  isActive?: boolean;
}

