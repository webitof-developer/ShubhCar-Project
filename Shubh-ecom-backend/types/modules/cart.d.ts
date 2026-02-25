// Compatibility re-exports from module-local type source of truth.
export type {
  QueryScalar,
  CartParams,
  CartQuery,
  CartBody,
  CartRequestContext,
  CartRequestShape,
  CartRequest,
  CartEntity,
  CartServiceInput,
  CartServiceResult,
  CartRepoFilter,
  CartRepoUpdate,
  CartValidatorInput,
  // Domain types
  CartPriceType,
  CartItemRecord,
  CartRecord,
  AddToCartInput,
  UpdateCartItemInput,
  ApplyCouponInput,
} from '../../modules/cart/cart.types';
