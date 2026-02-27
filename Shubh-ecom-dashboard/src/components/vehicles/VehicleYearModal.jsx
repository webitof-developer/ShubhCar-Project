import { Button, Form, Modal } from 'react-bootstrap'

const VehicleYearModal = ({ show, onHide, form, setForm, onSave }) => (
  <Modal show={show} onHide={onHide} contentClassName="create-modal">
    <Modal.Header closeButton>
      <Modal.Title>Add Model Year</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Year</Form.Label>
          <Form.Control
            type="number"
            placeholder="e.g., 2022"
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>Close</Button>
      <Button variant="primary" onClick={onSave}>Save</Button>
    </Modal.Footer>
  </Modal>
)

export default VehicleYearModal
