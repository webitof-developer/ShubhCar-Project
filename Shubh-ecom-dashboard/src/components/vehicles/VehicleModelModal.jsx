import { Button, Form, Modal } from 'react-bootstrap'
import DropzoneFormInput from '@/components/form/DropzoneFormInput'
import MediaPickerModal from '@/components/media/MediaPickerModal'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useState } from 'react'

const VehicleModelModal = ({
  show,
  onHide,
  form,
  setForm,
  uploading,
  onUpload,
  onSave,
  resolveMediaUrl,
  brands,
}) => {
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  return (
    <>
      <Modal show={show} onHide={onHide} contentClassName="create-modal">
        <Modal.Header closeButton>
          <Modal.Title>Add Vehicle Model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Brand</Form.Label>
              <Form.Select
                value={form.brandId}
                onChange={(e) => setForm((prev) => ({ ...prev, brandId: e.target.value }))}
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>{brand.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Model Name</Form.Label>
              <Form.Control
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Swift, City"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="d-block">Model Image (optional)</Form.Label>
              {form.image ? (
                <div className="position-relative d-inline-block">
                  <img
                    src={resolveMediaUrl(form.image)}
                    alt="Model"
                    className="rounded border"
                    style={{ width: 140, height: 140, objectFit: 'cover' }}
                  />
                  <Button
                    type="button"
                    variant="light"
                    className="position-absolute top-0 start-100 translate-middle p-0 rounded-circle border"
                    style={{ width: 26, height: 26 }}
                    onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                    title="Remove image"
                  >
                    <IconifyIcon icon="mdi:close" width={16} height={16} />
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <DropzoneFormInput
                    text="Drag & drop image here, or click to upload"
                    textClassName="fs-6"
                    className="py-4"
                    iconProps={{ icon: 'bx:cloud-upload', width: 28, height: 28 }}
                    showPreview={false}
                    maxFiles={1}
                    onFileUpload={onUpload}
                  />
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowMediaPicker(true)}
                    disabled={uploading}
                  >
                    Choose from Media Library
                  </Button>
                  {uploading && <div className="text-muted mt-2">Uploading...</div>}
                </div>
              )}
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

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        multiple={false}
        usedIn="product"
        onSelect={(items) => {
          const selected = items[0]
          if (selected?.url) {
            setForm((prev) => ({ ...prev, image: selected.url }))
          }
        }}
      />
    </>
  )
}

export default VehicleModelModal
