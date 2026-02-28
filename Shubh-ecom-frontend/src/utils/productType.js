// Central product type helpers to avoid inline label duplication
export const PRODUCT_TYPES = {
  OEM: 'OEM',
  OES: 'OES',
  AFTERMARKET: 'AFTERMARKET',
};

export const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.OEM]: 'OEM',
  [PRODUCT_TYPES.OES]: 'OES',
  [PRODUCT_TYPES.AFTERMARKET]: 'Aftermarket',
};

export const PRODUCT_TYPE_BADGE = {
  [PRODUCT_TYPES.OEM]: 'OEM Part',
  [PRODUCT_TYPES.OES]: 'OES Part',
  [PRODUCT_TYPES.AFTERMARKET]: 'Aftermarket',
};

export const getProductTypeLabel = (type) =>
  PRODUCT_TYPE_LABELS[type] || PRODUCT_TYPE_LABELS[PRODUCT_TYPES.AFTERMARKET];

export const getProductTypeBadge = (type) =>
  PRODUCT_TYPE_BADGE[type] || PRODUCT_TYPE_BADGE[PRODUCT_TYPES.AFTERMARKET];

export const isOemProduct = (type) => type === PRODUCT_TYPES.OEM;
export const isOesProduct = (type) => type === PRODUCT_TYPES.OES;
export const isVehicleBasedProduct = (type) =>
  type === PRODUCT_TYPES.OEM || type === PRODUCT_TYPES.OES;

export const getProductTypeShortTag = (type) => {
  if (type === PRODUCT_TYPES.OEM) return 'OEM';
  if (type === PRODUCT_TYPES.OES) return 'OES';
  return 'AM';
};

export const getProductIdentifier = (product) => {
  if (!product) return 'N/A';
  if (product.productType === PRODUCT_TYPES.OEM) return product.oemNumber || 'N/A';
  if (product.productType === PRODUCT_TYPES.OES) return product.oesNumber || 'N/A';
  return product.manufacturerBrand || 'N/A';
};
