export const sanitizeIndianPincode = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 6);

export const isValidIndianPincode = (value) =>
  /^\d{6}$/.test(sanitizeIndianPincode(value));

