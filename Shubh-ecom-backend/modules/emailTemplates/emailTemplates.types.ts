import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface EmailTemplatesServiceInput {
  [key: string]: any;
}

export type EmailTemplatesServiceResult<T = any> = Promise<T>;

export interface EmailTemplatesRepoFilter {
  [key: string]: any;
}

export interface EmailTemplatesRepoUpdate {
  [key: string]: any;
}

export interface EmailTemplatesValidatorInput {
  [key: string]: any;
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
