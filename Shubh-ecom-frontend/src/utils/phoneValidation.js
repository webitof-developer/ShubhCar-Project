export const sanitizeIndianPhone = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);

export const isValidIndianPhone = (value) =>
  sanitizeIndianPhone(value).length === 10;

