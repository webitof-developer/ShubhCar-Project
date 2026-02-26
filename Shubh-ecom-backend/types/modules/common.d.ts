export type QueryScalar = string | number | boolean | null | undefined;

export interface AuthenticatedUser {
  _id?: string;
  id?: string;
  userId?: string;
  email?: string;
  phone?: string;
  role?: string;
  [key: string]: unknown;
}

export type UploadedFiles =
  | Express.Multer.File[]
  | Record<string, Express.Multer.File[]>;

export interface BaseParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface BaseQuery {
  page?: QueryScalar;
  limit?: QueryScalar;
  sort?: QueryScalar;
  order?: QueryScalar;
  search?: QueryScalar;
  cursor?: QueryScalar;
  [key: string]: QueryScalar;
}

export interface BasePayload {
  [key: string]: unknown;
}

export interface ModuleRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: UploadedFiles;
  [key: string]: unknown;
}

export type GenericRecord = Record<string, unknown>;

export type ServiceResult<T = unknown> = Promise<T>;

export interface ModuleRequestShape<P extends BaseParams, Q extends BaseQuery, B extends BasePayload> {
  params: P;
  query: Q;
  body: B;
}
