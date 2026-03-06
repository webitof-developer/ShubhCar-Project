import { isValidIndianPhone, sanitizeIndianPhone } from './phoneValidation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;

export const normalizeTextField = (value) => String(value || '').trim();

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

export const isValidPersonName = (value) => NAME_REGEX.test(String(value || '').trim());

export const validateNameField = (value, label = 'Name') => {
  const trimmed = normalizeTextField(value);
  if (!trimmed) return `${label} is required`;
  if (!isValidPersonName(trimmed)) {
    return `${label} must be 2-50 characters and contain only letters`;
  }
  return '';
};

export const validateEmailField = (value, required = true) => {
  const trimmed = normalizeTextField(value);
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

export const validateSubjectField = (value, required = true) => {
  const trimmed = normalizeTextField(value);
  if (!trimmed) return required ? 'Subject is required' : '';
  if (trimmed.length > 200) return 'Subject must be less than 200 characters';
  return '';
};

export const validateMessageField = (value, { minLength = 10, maxLength = 5000 } = {}) => {
  const trimmed = normalizeTextField(value);
  if (!trimmed) return 'Message is required';
  if (trimmed.length < minLength) return `Message must be at least ${minLength} characters`;
  if (trimmed.length > maxLength) return `Message must be less than ${maxLength} characters`;
  return '';
};

export const validatePasswordField = (value, { required = true, minLength = 6 } = {}) => {
  const normalized = String(value || '');
  if (!normalized) return required ? 'Password is required' : '';
  if (normalized.length < minLength) return `Password must be at least ${minLength} characters`;
  return '';
};
