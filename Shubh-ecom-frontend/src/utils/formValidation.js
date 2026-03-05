import { isValidIndianPhone, sanitizeIndianPhone } from './phoneValidation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

export const isValidPersonName = (value) => NAME_REGEX.test(String(value || '').trim());

export const validateNameField = (value, label = 'Name') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return `${label} is required`;
  if (!isValidPersonName(trimmed)) {
    return `${label} must be 2-50 characters and contain only letters`;
  }
  return '';
};

export const validateEmailField = (value, required = true) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return required ? 'Email is required' : '';
  if (!isValidEmail(trimmed)) return 'Please enter a valid email address';
  return '';
};

export const validatePhoneField = (value, required = true) => {
  const sanitized = sanitizeIndianPhone(value);
  if (!sanitized) return required ? 'Phone number is required' : '';
  if (!isValidIndianPhone(sanitized)) {
    return 'Phone number must be 10 digits and start with 6-9';
  }
  return '';
};

