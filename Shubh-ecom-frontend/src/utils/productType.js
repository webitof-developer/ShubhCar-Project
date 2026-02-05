// Central product type helpers to avoid inline label duplication
export const PRODUCT_TYPES = {
  OEM: 'OEM',
  AFTERMARKET: 'AFTERMARKET',
};

export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.OEM]: 'OEM',
  [PRODUCT_TYPES.AFTERMARKET]: 'Aftermarket',
};

export const PRODUCT_TYPE_BADGE = {
  [PRODUCT_TYPES.OEM]: 'OEM Part',
  [PRODUCT_TYPES.AFTERMARKET]: 'Aftermarket',
};

export const getProductTypeLabel = (type) =>
  PRODUCT_TYPE_LABELS[type] || PRODUCT_TYPE_LABELS[PRODUCT_TYPES.AFTERMARKET];

export const getProductTypeBadge = (type) =>
  PRODUCT_TYPE_BADGE[type] || PRODUCT_TYPE_BADGE[PRODUCT_TYPES.AFTERMARKET];

export const isOemProduct = (type) => type === PRODUCT_TYPES.OEM;
