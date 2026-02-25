// Compatibility re-exports from module-local type source of truth.
export type {
  QueryScalar,
  TagsParams,
  TagsQuery,
  TagsBody,
  TagsRequestContext,
  TagsRequestShape,
  TagsRequest,
  TagsEntity,
  TagsServiceInput,
  TagsServiceResult,
  TagsRepoFilter,
  TagsRepoUpdate,
  TagsValidatorInput,
  // Domain types — tags.types.ts already has strong types
  TagRecord,
  ListTagsQuery,
  CreateTagInput,
  UpdateTagInput,
  TagsPaginationMeta,
  ListTagsResult,
} from '../../modules/tags/tags.types';
