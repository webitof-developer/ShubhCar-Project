export const sanitizeIndianPhone = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);

export const isValidIndianPhone = (value) =>
  /^[6-9]\d{9}$/.test(sanitizeIndianPhone(value));

