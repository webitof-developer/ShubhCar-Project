// Compatibility re-exports from module-local type source of truth.
export type {
  QueryScalar,
  InventoryParams,
  InventoryQuery,
  InventoryBody,
  InventoryRequestContext,
  InventoryRequestShape,
  InventoryRequest,
  InventoryEntity,
  InventoryServiceInput,
  InventoryServiceResult,
  InventoryRepoFilter,
  InventoryRepoUpdate,
  InventoryValidatorInput,
  // Domain types
  InventoryChangeType,
  AdjustInventoryInput,
  ReleaseInventoryInput,
  AdminInventoryAdjustInput,
} from '../../modules/inventory/inventory.types';
