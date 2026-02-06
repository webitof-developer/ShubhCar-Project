import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/helpers/apiBase';
import { validateIndianPhone, validateEmail, isRequired } from '@/helpers/validationHelpers';

/**
 * Custom hook for real-time form validation with duplicate checking
 * @param {Object} initialState - Initial form values
 * @param {Object} validationRules - Validation rules per field
 * @returns {Object} - Form state, errors, handlers
 */
export const useFormValidation = (initialState = {}, validationRules = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [checking, setChecking] = useState({});
  const debounceTimers = useRef({});

  /**
   * Validate a single field
   */
  const validateField = useCallback(async (fieldName, value, excludeId = null) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // Required check
    if (rules.required && !isRequired(value)) {
      return `${rules.label || fieldName} is required`;
    }

    // Skip further validation if empty and not required
    if (!value && !rules.required) return null;

    // Email validation
    if (rules.type === 'email') {
      if (!validateEmail(value)) {
        return 'Please enter a valid email address';
      }
      
      // Duplicate check
      if (rules.checkDuplicate) {
        setChecking(prev => ({ ...prev, [fieldName]: true }));
        try {
          const params = new URLSearchParams({ email: value });
          if (excludeId) params.append('excludeUserId', excludeId);
          
          const response = await fetch(`${API_BASE_URL}/users/validate/email?${params}`);
          const data = await response.json();
          
          if (!data.data?.available) {
            setChecking(prev => ({ ...prev, [fieldName]: false }));
            return 'Email is already registered';
          }
        } catch (error) {
          console.error('Duplicate check failed:', error);
        }
        setChecking(prev => ({ ...prev, [fieldName]: false }));
      }
    }

    // Phone validation
    if (rules.type === 'phone') {
      if (!validateIndianPhone(value)) {
        return 'Please enter a valid 10-digit phone number';
      }
      
      // Duplicate check
      if (rules.checkDuplicate) {
        setChecking(prev => ({ ...prev, [fieldName]: true }));
        try {
          const params = new URLSearchParams({ phone: value });
          if (excludeId) params.append('excludeUserId', excludeId);
          
          const response = await fetch(`${API_BASE_URL}/users/validate/phone?${params}`);
          const data = await response.json();
          
          if (!data.data?.available) {
            setChecking(prev => ({ ...prev, [fieldName]: false }));
            return 'Mobile number is already registered';
          }
        } catch (error) {
          console.error('Duplicate check failed:', error);
        }
        setChecking(prev => ({ ...prev, [fieldName]: false }));
      }
    }

    // Min length
    if (rules.minLength && value.length < rules.minLength) {
      return `${rules.label || fieldName} must be at least ${rules.minLength} characters`;
    }

   // Custom validator
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, formData);
      if (customError) return customError;
    }

    return null;
  }, [validationRules, formData]);

  /**
   * Handle field change with debounced validation
   */
  const handleChange = useCallback((fieldName, value, excludeId = null) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear previous timer
    if (debounceTimers.current[fieldName]) {
      clearTimeout(debounceTimers.current[fieldName]);
    }

    // Debounce validation (500ms for duplicate checks, immediate for others)
    const rules = validationRules[fieldName];
    const delay = rules?.checkDuplicate ? 500 : 0;
    
    debounceTimers.current[fieldName] = setTimeout(async () => {
      const error = await validateField(fieldName, value, excludeId);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }, delay);
  }, [validateField, validationRules]);

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  /**
   * Validate all fields
   */
  const validateAll = useCallback(async (excludeId = null) => {
    const newErrors = {};
    const fieldNames = Object.keys(validationRules);

    for (const fieldName of fieldNames) {
      const error = await validateField(fieldName, formData[fieldName], excludeId);
      if (error) newErrors[fieldName] = error;
    }

    setErrors(newErrors);
    setTouched(
      fieldNames.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );

    return Object.keys(newErrors).length === 0;
  }, [formData, validateField, validationRules]);

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
    setChecking({});
  }, [initialState]);

  return {
    formData,
    errors,
    touched,
    checking,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFormData,
  };
};
