// Compatibility re-exports from module-local type source of truth.
export type {
  QueryScalar,
  PaymentsParams,
  PaymentsQuery,
  PaymentsBody,
  PaymentsRequestContext,
  PaymentsRequestShape,
  PaymentsRequest,
  PaymentsEntity,
  PaymentsServiceInput,
  PaymentsServiceResult,
  PaymentsRepoFilter,
  PaymentsRepoUpdate,
  PaymentsValidatorInput,
  // Domain types
  PaymentGateway,
  PaymentRecordStatus,
  RefundInfo,
  PaymentRecord,
  CreatePaymentInput,
  PaymentServiceContext,
} from '../../modules/payments/payments.types';
