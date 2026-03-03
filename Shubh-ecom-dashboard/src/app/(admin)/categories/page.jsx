'use client'
import logger from '@/lib/logger'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { API_BASE_URL } from '@/helpers/apiBase'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Badge,
  Modal,
  Form,
} from 'react-bootstrap'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageTitle from '@/components/PageTitle'
import FormErrorModal from '@/components/forms/FormErrorModal'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'
import DataTable from '@/components/shared/DataTable'
import StatusToggle from '@/components/shared/StatusToggle'
import MediaPickerModal from '@/components/media/MediaPickerModal'

const MAX_CATEGORY_IMAGE_BYTES = 2 * 1024 * 1024
const CATEGORY_ICON_SIZE_PX = 256
const ALLOWED_CATEGORY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '')

const getImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
      URL.revokeObjectURL(url)
    }
    image.onerror = () => {
      reject(new Error('Unable to read image dimensions'))
      URL.revokeObjectURL(url)
    }
    image.src = url
  })

const getRemoteImageDimensions = (url) =>
  new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Invalid image URL'))
      return
    }

    const image = new window.Image()
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      reject(new Error('Unable to read selected media dimensions'))
    }
    image.src = url
  })

const resolveImageUrl = (url) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`
}


const flattenCategories = (nodes = []) => {
  const result = []
  const walk = (list, rootName = null) => {
    list.forEach((node) => {
      result.push({
        ...node,
        parentName: rootName,
        parentId: node.parentId || null,
      })
      if (Array.isArray(node.children) && node.children.length) {
        walk(node.children, rootName || node.name)
      }
    })
  }
  walk(nodes, null)
  return result
}

const CategoriesPage = () => {
  const { data: session, status } = useSession()
  const [tree, setTree] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    parentId: '',
    name: '',
    slug: '',
    imageUrl: '',
    isActive: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [formDataSnapshot, setFormDataSnapshot] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [modalError, setModalError] = useState(null)

  const fetchCategories = async () => {
    if (status !== 'authenticated') return

    const token = session?.accessToken
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/categories/hierarchy`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      const treeData = data.data || []
      setTree(treeData)
      setCategories(flattenCategories(treeData))
      setError(null)
    } catch (err) {
      logger.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [status])

  const handleOpenModal = () => {
    setEditMode(false)
    setEditingId(null)
    setFormData({ parentId: '', name: '', slug: '', imageUrl: '', isActive: true })
    setShowModal(true)
    setSuccessMessage(null)
    setError(null)
    setModalError(null)
    setValidationErrors({})
    setTouchedFields({})
  }

  const handleOpenEditModal = (cat) => {
    setEditMode(true)
    setEditingId(cat._id)
    const snap = {
      parentId: cat.parentId || '',
      name: cat.name || '',
      slug: cat.slug || '',
      imageUrl: cat.imageUrl || '',
      isActive: !!cat.isActive,
    }
    setFormData(snap)
    setFormDataSnapshot(snap)
    setShowModal(true)
    setSuccessMessage(null)
    setError(null)
    setModalError(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditMode(false)
    setEditingId(null)
    setFormDataSnapshot(null)
    setModalError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = session?.accessToken
    if (!token) return

    // Validation
    const errors = {}
    if (!formData.name?.trim()) {
      errors.name = 'Name is required'
    }
    if (!formData.slug?.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setShowErrorModal(true)
      return
    }

    // In edit mode, skip API call if nothing changed
    if (editMode && formDataSnapshot) {
      const unchanged =
        formData.name === formDataSnapshot.name &&
        formData.slug === formDataSnapshot.slug &&
        formData.parentId === formDataSnapshot.parentId &&
        formData.imageUrl === formDataSnapshot.imageUrl &&
        formData.isActive === formDataSnapshot.isActive
      if (unchanged) {
        handleCloseModal()
        return
      }
    }

    try {
      setSubmitting(true)
      const payload = {
        name: formData.name,
        slug: formData.slug,
        parentId: formData.parentId || null,
        imageUrl: formData.imageUrl || null,
        isActive: formData.isActive,
      }

      const method = editMode ? 'PUT' : 'POST'
      const url = editMode
        ? `${API_BASE_URL}/categories/admin/${editingId}`
        : `${API_BASE_URL}/categories/admin`

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.message || 'Failed to create category')
      }

      setSuccessMessage(editMode ? 'Category updated successfully!' : 'Category created successfully!')
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      logger.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCategoryImageSelection = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setError(null)
      setModalError(null)

      if (!ALLOWED_CATEGORY_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Only JPG, PNG, and WEBP images are allowed')
      }

      if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
        throw new Error('Image size must be 2MB or smaller')
      }

      const { width, height } = await getImageDimensions(file)
      if (width !== CATEGORY_ICON_SIZE_PX || height !== CATEGORY_ICON_SIZE_PX) {
        throw new Error(`Image must be exactly ${CATEGORY_ICON_SIZE_PX}x${CATEGORY_ICON_SIZE_PX}px`)
      }

      const token = session?.accessToken
      if (!token) throw new Error('Authentication required')

      setUploadingImage(true)
      const form = new FormData()
      form.append('image', file)

      const response = await fetch(`${API_BASE_URL}/categories/admin/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      })

      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.message || 'Image upload failed')
      }

      const imageUrl = body?.data?.imageUrl
      if (!imageUrl) {
        throw new Error('Invalid upload response')
      }

      setFormData((prev) => ({ ...prev, imageUrl }))
      setSuccessMessage('Category image uploaded')
    } catch (err) {
      logger.error(err)
      setModalError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleMediaSelect = async (items = []) => {
    const selected = Array.isArray(items) ? items[0] : null
    if (!selected) return

    try {
      setError(null)
      setModalError(null)

      if (!ALLOWED_CATEGORY_IMAGE_TYPES.includes(selected.mimeType)) {
        throw new Error('Only JPG, JPEG, PNG, and WEBP media can be used as category icon')
      }

      let width = Number(selected.width)
      let height = Number(selected.height)

      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        const url = resolveImageUrl(selected.url)
        const remoteDimensions = await getRemoteImageDimensions(url)
        width = remoteDimensions.width
        height = remoteDimensions.height
      }

      if (width !== CATEGORY_ICON_SIZE_PX || height !== CATEGORY_ICON_SIZE_PX) {
        throw new Error(`Selected media must be exactly ${CATEGORY_ICON_SIZE_PX}x${CATEGORY_ICON_SIZE_PX}px`)
      }

      setFormData((prev) => ({ ...prev, imageUrl: selected.url }))
      setSuccessMessage('Category image selected from media library')
    } catch (err) {
      logger.error(err)
      setModalError(err.message)
    }
  }

  const handleToggleActive = async (cat) => {
    const token = session?.accessToken
    if (!token) return
    try {
      setTogglingId(cat._id)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/categories/admin/${cat._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.message || 'Failed to update category')
      }
      setSuccessMessage('Category status updated')
      fetchCategories()
    } catch (err) {
      logger.error(err)
      setError(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  // 3. Replace delete handler with modal pattern
  const handleDeleteClick = (cat) => {
    setCategoryToDelete(cat)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const cat = categoryToDelete
    if (!cat) return
    const token = session?.accessToken
    if (!token) return

    try {
      setDeletingId(cat._id)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/categories/admin/${cat._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.message || 'Failed to delete category')
      }
      setSuccessMessage('Category deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      fetchCategories()
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (err) {
      logger.error(err)
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const parentOptions = useMemo(() => {
    return [
      { label: 'No parent (Root)', value: '' },
      ...categories.map((cat) => ({
        label: cat.parentName ? `${cat.parentName} / ${cat.name}` : cat.name,
        value: cat._id,
      })),
    ]
  }, [categories])

  if (status === 'loading' || (loading && !categories.length)) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Alert variant="warning">Please log in to manage categories.</Alert>
  }

  return (
    <>
      <PageTitle title="CATEGORY MANAGEMENT" />

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Row>
        <Col xl={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <CardTitle as="h4" className="mb-0">
                All Categories
              </CardTitle>
              <Button size="sm" variant="primary" onClick={handleOpenModal} className="d-flex align-items-center gap-1">
                <IconifyIcon icon="bx:plus" />
                Add Category
              </Button>
            </CardHeader>
            <CardBody>
              <DataTable
                columns={[
                  { key: 'checkbox', label: '', width: 20, render: () => <Form.Check /> },
                  { key: 'image', label: 'Image', render: (cat) => (
                    cat.imageUrl ? (
                      <img
                        src={resolveImageUrl(cat.imageUrl)}
                        alt={cat.name}
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <span className="text-muted small">No image</span>
                    )
                  ) },
                  { key: 'name', label: 'Name', render: (cat) => <span className="fw-medium">{cat.name}</span> },
                  { key: 'slug', label: 'Slug', render: (cat) => <code>{cat.slug}</code> },
                  { key: 'parent', label: 'Parent', render: (cat) => cat.parentName || 'Root' },
                  { key: 'status', label: 'Status', render: (cat) => (
                    <Badge bg={cat.isActive ? 'success' : 'secondary'} className="badge-subtle">
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  )},
                  { key: 'active', label: 'Active', render: (cat) => (
                    <StatusToggle
                      checked={!!cat.isActive}
                      onChange={() => handleToggleActive(cat)}
                      loading={togglingId === cat._id}
                      label={cat.isActive ? 'Active' : 'Inactive'}
                    />
                  )},
                  { key: 'actions', label: 'Actions', render: (cat) => (
                    <div className="d-flex gap-2">
                      <Button
                        variant="soft-primary"
                        size="sm"
                        onClick={() => handleOpenEditModal(cat)}
                      >
                        <IconifyIcon icon="solar:pen-2-broken" />
                      </Button>
                      <Button
                        variant="soft-danger"
                        size="sm"
                        disabled={deletingId === cat._id}
                        onClick={() => handleDeleteClick(cat)}
                      >
                        {deletingId === cat._id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <IconifyIcon icon="solar:trash-bin-minimalistic-2-broken" />
                        )}
                      </Button>
                    </div>
                  )}
                ]}
                data={categories}
                loading={loading}
                emptyMessage="No categories found."
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Category' : 'Create Category'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {modalError && (
              <Alert variant="danger" dismissible onClose={() => setModalError(null)}>
                {modalError}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Parent</Form.Label>
              <Form.Select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                {parentOptions.map((opt) => (
                  <option key={opt.value || 'root'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                Leave empty to create a root category. Selecting a parent will create a subcategory.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Name
                <span className="text-danger ms-1">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setTouchedFields({ ...touchedFields, name: true })
                }}
                isInvalid={touchedFields.name && validationErrors.name}
                required
              />
              {touchedFields.name && validationErrors.name && (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.name}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Slug
                <span className="text-danger ms-1">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.slug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setFormData({ ...formData, slug: value })
                  setTouchedFields({ ...touchedFields, slug: true })
                }}
                isInvalid={touchedFields.slug && validationErrors.slug}
                required
              />
              {touchedFields.slug && validationErrors.slug && (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.slug}
                </Form.Control.Feedback>
              )}
              <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                Only lowercase letters, numbers, and hyphens allowed
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category Image</Form.Label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <label className="btn btn-outline-primary btn-sm mb-0">
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCategoryImageSelection}
                    disabled={uploadingImage}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline-primary"
                  onClick={() => setShowMediaPicker(true)}
                >
                  Choose from Media
                </Button>
                {formData.imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline-danger"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Form.Text className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                Use JPG/JPEG/PNG/WEBP only, exactly {CATEGORY_ICON_SIZE_PX}x{CATEGORY_ICON_SIZE_PX}px, max 2MB.
              </Form.Text>
              {formData.imageUrl && (
                <div className="mt-2">
                  <img
                    src={resolveImageUrl(formData.imageUrl)}
                    alt="Category preview"
                    style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }}
                  />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update' : 'Create')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Form Validation Errors Modal */}
      <FormErrorModal
        show={showErrorModal}
        errors={validationErrors}
        onClose={() => setShowErrorModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemType="category"
        itemName={categoryToDelete?.name}
        deleting={deletingId === categoryToDelete?._id}
      />

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        multiple={false}
        title="Select Category Icon"
        onSelect={handleMediaSelect}
      />
    </>
  )
}

export default CategoriesPage
