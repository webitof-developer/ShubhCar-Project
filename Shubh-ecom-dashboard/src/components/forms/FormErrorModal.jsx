import { Modal, Button, ListGroup, Alert } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { formatErrorMessages } from '@/helpers/validationHelpers';

/**
 * Modal to display form validation errors
 */
const FormErrorModal = ({ show, errors, onClose }) => {
  const errorMessages = formatErrorMessages(errors);

  if (errorMessages.length === 0) return null;

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconifyIcon icon="bx:error-circle" className="fs-4" />
          Form Validation Errors  
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger" className="mb-3">
          <strong>Please fix the following errors:</strong>
        </Alert>
        <ListGroup variant="flush">
          {errorMessages.map((msg, idx) => (
            <ListGroup.Item key={idx} className="py-2">
              <IconifyIcon icon="bx:x-circle" className="text-danger me-2" />
              {msg}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FormErrorModal;
