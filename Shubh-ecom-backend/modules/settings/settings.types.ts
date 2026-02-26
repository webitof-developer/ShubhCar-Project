import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface SettingsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface SettingsQuery {
  group?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface SettingsBody {
  [key: string]: unknown;
}

export interface SettingsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface SettingsRequestShape {
  params: SettingsParams;
  query: SettingsQuery;
  body: SettingsBody;
}

export type SettingsRequest = Request<
  SettingsParams,
  unknown,
  SettingsBody,
  SettingsQuery
> &
  SettingsRequestContext;

export interface SettingsEntity {
  [key: string]: unknown;
}

export interface SettingsServiceInput {
  [key: string]: unknown;
}

export type SettingsServiceResult<T = unknown> = ServiceResult<T>;

export interface SettingsRepoFilter {
  [key: string]: unknown;
}

export interface SettingsRepoUpdate {
  [key: string]: unknown;
}

export interface SettingsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type SettingType = 'string' | 'number' | 'boolean' | 'json' | 'array';

export interface SettingRecord {
  _id: string;
  key: string;
  value: unknown;
  group?: string;
  type: SettingType;
  isPublic: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingInput {
  value: unknown;
  description?: string;
}

export interface BatchUpdateSettingsInput {
  settings: { key: string; value: unknown }[];
}

