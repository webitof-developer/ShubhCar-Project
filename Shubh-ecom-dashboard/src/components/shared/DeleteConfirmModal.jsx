import { Modal, Button } from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

/**
 * Reusable delete confirmation modal component
 * @param {boolean} show - Whether modal is visible
 * @param {function} onHide - Handler to close modal
 * @param {function} onConfirm - Handler when user confirms deletion
 * @param {string} title - Modal title (default: "Confirm Delete")
 * @param {string} itemName - Name of item being deleted (displayed prominently)
 * @param {string} itemType - Type of item (e.g., "coupon", "category")
 * @param {string} message - Custom message (overrides default)
 * @param {ReactNode} children - Additional content to display
 * @param {boolean} deleting - Whether deletion is in progress (shows loading state)
 * @param {string} variant - Button variant (default: "danger")
 */
const DeleteConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Confirm Delete',
  itemName,
  itemType = 'item',
  message,
  children,
  deleting = false,
  variant = 'danger'
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconifyIcon 
            icon="solar:trash-bin-minimalistic-2-bold-duotone" 
            className="text-danger fs-4" 
          />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message || (
          <p className="mb-3">
            Are you sure you want to delete this {itemType}?
          </p>
        )}
        {itemName && (
          <div className="alert alert-warning mb-3">
            <strong>{itemName}</strong>
          </div>
        )}
        {children}
        <p className="text-muted small mb-0">
          <IconifyIcon icon="solar:danger-triangle-bold" className="me-1" />
          This action cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={deleting}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={deleting}>
          {deleting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Deleting...
            </>
          ) : (
            <>
              <IconifyIcon icon="solar:trash-bin-minimalistic-bold" className="me-1" />
              Delete
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteConfirmModal
