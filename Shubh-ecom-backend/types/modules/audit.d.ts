// Compatibility re-exports from module-local type source of truth.
export type {
  QueryScalar,
  AuditParams,
  AuditQuery,
  AuditBody,
  AuditRequestContext,
  AuditRequestShape,
  AuditRequest,
  AuditEntity,
  AuditServiceInput,
  AuditServiceResult,
  AuditRepoFilter,
  AuditRepoUpdate,
  AuditValidatorInput,
  // Domain types
  AuditActor,
  AuditTarget,
  AuditLogInput,
  AuditLogRecord,
} from '../../modules/audit/audit.types';
