import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface SettingsServiceInput {
  [key: string]: any;
}

export type SettingsServiceResult<T = any> = Promise<T>;

export interface SettingsRepoFilter {
  [key: string]: any;
}

export interface SettingsRepoUpdate {
  [key: string]: any;
}

export interface SettingsValidatorInput {
  [key: string]: any;
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
