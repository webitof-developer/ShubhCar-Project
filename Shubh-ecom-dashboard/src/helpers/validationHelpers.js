/**
 * Validation helper functions
 */

/**
 * Validates Indian phone number format (10 digits starting with 6-9)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const validateIndianPhone = (phone) => {
  if (!phone) return true; // Allow empty if not required
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  return /^[6-9]\d{9}$/.test(cleaned);
};

/**
 * Formats phone input to only allow digits
 * @param {string} value - Raw input value
 * @returns {string} - Digits only
 */
export const formatPhoneInput = (value) => {
  return value.replace(/\D/g, '');
};

/**
 * Formats Indian mobile input to max 10 digits
 * @param {string} value - Raw input value
 * @returns {string} - Digits only, max 10 chars
 */
export const sanitizeIndianMobileInput = (value) => {
  return formatPhoneInput(String(value || '')).slice(0, 10);
};

/**
 * Sanitizes Indian postal code input to digits only (max 6 digits)
 * @param {string} value - Raw input value
 * @returns {string} - Digits only, max 6 chars
 */
export const sanitizeIndianPostalCodeInput = (value) => {
  return formatPhoneInput(String(value || '')).slice(0, 6);
};

/**
 * Validates Indian postal code format (exactly 6 digits)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} - True if valid
 */
export const validateIndianPostalCode = (postalCode) => {
  return /^\d{6}$/.test(String(postalCode || '').trim());
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const validateEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
};

/**
 * Validates person name (2-50 chars, letters/spaces/apostrophe/dot/hyphen)
 * @param {string} name - Name to validate
 * @returns {boolean}
 */
export const validatePersonName = (name) => {
  if (!name) return false;
  return /^[A-Za-z][A-Za-z\s'.-]{1,49}$/.test(String(name).trim());
};

/**
 * Sanitizes form input by trimming whitespace
 * @param {string} value - Value to sanitize
 * @returns {string} - Trimmed value
 */
export const sanitizeInput = (value) => {
  return typeof value === 'string' ? value.trim() : value;
};

/**
 * Validates required field
 * @param {any} value - Value to check
 * @returns {boolean} - True if not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Format error messages for display
 * @param {Object} errors - Error object from validation
 * @returns {string[]} - Array of formatted error messages
 */
export const formatErrorMessages = (errors) => {
  if (!errors || typeof errors !== 'object') return [];
  
  return Object.entries(errors).map(([field, message]) => {
    const fieldLabel = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    return `${fieldLabel}: ${message}`;
  });
};
