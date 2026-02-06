import { Form, Spinner } from 'react-bootstrap';
import { formatPhoneInput } from '@/helpers/validationHelpers';

/**
 * Validated input component with immediate visual feedback
 */
const ValidatedInput = ({
  label,
  name,
  value,
  error,
  touched,
  checking,
  required,
  type = 'text',
  onChange,
  onBlur,
  placeholder,
  disabled,
  ...props
}) => {
  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    
    // Phone: digits only
    if (type === 'tel' || type === 'phone') {
      inputValue = formatPhoneInput(inputValue);
    }
    
    onChange(name, inputValue);
  };

  const hasError = touched && error;
  const isValid = touched && !error && !checking;

  return (
    <Form.Group className="mb-3">
      <Form.Label>
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </Form.Label>
      <div className="position-relative">
        <Form.Control
          type={type === 'phone' ? 'tel' : type}
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          onBlur={() => onBlur(name)}
          placeholder={placeholder}
          disabled={disabled || checking}
          isInvalid={hasError}
          isValid={isValid}
          {...props}
        />
        {checking && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-3">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        <Form.Control.Feedback type="invalid">
          {error}
        </Form.Control.Feedback>
      </div>
    </Form.Group>
  );
};

export default ValidatedInput;
