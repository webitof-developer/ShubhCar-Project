export type QueryScalar = string | number | boolean | null | undefined;

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

export interface ModuleRequestShape<P extends BaseParams, Q extends BaseQuery, B extends BasePayload> {
  params: P;
  query: Q;
  body: B;
}
