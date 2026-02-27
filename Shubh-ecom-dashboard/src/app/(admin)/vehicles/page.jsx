'use client'
import PageTItle from '@/components/PageTitle'
import { Card, CardBody, Col, Row, Spinner, Table, Button, Form, Modal } from 'react-bootstrap'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { API_BASE_URL, API_ORIGIN } from '@/helpers/apiBase'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { mediaAPI } from '@/helpers/mediaApi'
import VehicleBrandModal from '@/components/vehicles/VehicleBrandModal'
import VehicleModelModal from '@/components/vehicles/VehicleModelModal'
import VehicleYearModal from '@/components/vehicles/VehicleYearModal'

const VehiclesPage = () => {
  const { data: session } = useSession()
  const [vehicles, setVehicles] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [years, setYears] = useState([])
  const [attributes, setAttributes] = useState([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({ brandId: '', modelId: '', yearId: '', status: '' })

  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [vehicleForm, setVehicleForm] = useState({
    brandId: '',
    modelId: '',
    yearId: '',
    variantName: '',
    status: 'active',
  })
  const [attributeSelections, setAttributeSelections] = useState({})
  const [vehicleFormSnapshot, setVehicleFormSnapshot] = useState(null)
  const [attributeSelectionsSnapshot, setAttributeSelectionsSnapshot] = useState(null)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [brandForm, setBrandForm] = useState({ name: '', description: '', logo: '', status: 'active' })
  const [modelForm, setModelForm] = useState({ brandId: '', name: '', image: '', status: 'active' })
  const [yearForm, setYearForm] = useState({ year: '', status: 'active' })
  const [brandUploading, setBrandUploading] = useState(false)
  const [modelUploading, setModelUploading] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const mediaBaseUrl = API_ORIGIN

  const resolveMediaUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${mediaBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const brandMap = useMemo(() => {
    const map = new Map()
    brands.forEach((brand) => map.set(brand._id, brand))
    return map
  }, [brands])

  const modelMap = useMemo(() => {
    const map = new Map()
    models.forEach((model) => map.set(model._id, model))
    return map
  }, [models])

  const yearMap = useMemo(() => {
    const map = new Map()
    years.forEach((year) => map.set(year._id, year))
    return map
  }, [years])

  const fetchBrands = async () => {
    const response = await fetch(`${API_BASE_URL}/vehicle-brands?limit=200`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })
    if (response.ok) {
      const result = await response.json()
      const data = result.data || result
      setBrands(data.items || [])
    }
  }

  const fetchModels = async (brandId = '') => {
    const query = brandId ? `?brandId=${brandId}&limit=200` : '?limit=200'
    const response = await fetch(`${API_BASE_URL}/vehicle-models${query}`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })
    if (response.ok) {
      const result = await response.json()
      const data = result.data || result
      setModels(data.items || [])
    }
  }

  const fetchYears = async () => {
    const response = await fetch(`${API_BASE_URL}/vehicle-years?limit=200`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })
    if (response.ok) {
      const result = await response.json()
      const data = result.data || result
      setYears(data.items || [])
    }
  }

  const fetchAttributes = async () => {
    const response = await fetch(`${API_BASE_URL}/vehicle-attributes/with-values?limit=200`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })
    if (response.ok) {
      const result = await response.json()
      const data = result.data || result
      setAttributes(data.items || [])
    }
  }

  const fetchVehicles = async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (filters.brandId) params.append('brandId', filters.brandId)
    if (filters.modelId) params.append('modelId', filters.modelId)
    if (filters.yearId) params.append('yearId', filters.yearId)
    if (filters.status) params.append('status', filters.status)

    const response = await fetch(`${API_BASE_URL}/vehicles?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    })

    if (response.ok) {
      const result = await response.json()
      const data = result.data || result
      setVehicles(data.items || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (session?.accessToken) {
      Promise.all([fetchBrands(), fetchModels(), fetchYears(), fetchAttributes()])
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session?.accessToken) {
      fetchVehicles()
    }
  }, [session, page, filters])

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingVehicle(item)
      const form = {
        brandId: item.brandId,
        modelId: item.modelId,
        yearId: item.yearId,
        variantName: item.variantName || item.display?.variantName || '',
        status: item.status || 'active',
      }
      setVehicleForm(form)
      setVehicleFormSnapshot(form)
      const selection = {}
      item.attributes?.forEach((attr) => {
        selection[String(attr.attributeId)] = String(attr.valueId)
      })
      setAttributeSelections(selection)
      setAttributeSelectionsSnapshot({ ...selection })
      fetchModels(item.brandId)
    } else {
      setEditingVehicle(null)
      setVehicleForm({ brandId: '', modelId: '', yearId: '', variantName: '', status: 'active' })
      setAttributeSelections({})
      setVehicleFormSnapshot(null)
      setAttributeSelectionsSnapshot(null)
    }
    setShowModal(true)
  }

  const handleBrandChange = async (brandId) => {
    setVehicleForm((prev) => ({ ...prev, brandId, modelId: '' }))
    await fetchModels(brandId)
  }

  const openBrandModal = () => {
    setBrandForm({ name: '', description: '', logo: '', status: 'active' })
    setShowBrandModal(true)
  }

  const openModelModal = () => {
    setModelForm({
      brandId: vehicleForm.brandId || '',
      name: '',
      image: '',
      status: 'active',
    })
    setShowModelModal(true)
  }

  const openYearModal = () => {
    setYearForm({ year: '', status: 'active' })
    setShowYearModal(true)
  }

  const handleBrandLogoUpload = async (files) => {
    const file = Array.isArray(files) ? files[files.length - 1] : null
    if (!file || !session?.accessToken) return
    setBrandUploading(true)
    try {
      const uploaded = await mediaAPI.upload([file], 'product', session.accessToken)
      const items = uploaded?.data || []
      const logoUrl = Array.isArray(items) && items.length ? items[0].url : ''
      setBrandForm((prev) => ({ ...prev, logo: logoUrl }))
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setBrandUploading(false)
    }
  }

  const handleModelImageUpload = async (files) => {
    const file = Array.isArray(files) ? files[files.length - 1] : null
    if (!file || !session?.accessToken) return
    setModelUploading(true)
    try {
      const uploaded = await mediaAPI.upload([file], 'product', session.accessToken)
      const items = uploaded?.data || []
      const imageUrl = Array.isArray(items) && items.length ? items[0].url : ''
      setModelForm((prev) => ({ ...prev, image: imageUrl }))
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setModelUploading(false)
    }
  }

  const handleCreateBrand = async () => {
    if (!session?.accessToken) return
    if (!brandForm.name.trim()) {
      toast.error('Please enter a name')
      return
    }
    if (!brandForm.logo) {
      toast.error('Please upload a brand logo')
      return
    }
    const response = await fetch(`${API_BASE_URL}/vehicle-brands`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandForm),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      toast.error(err?.message || 'Failed to save brand')
      return
    }
    const result = await response.json().catch(() => ({}))
    const created = result?.data?.item || result?.data || result?.item || result?.brand || result
    await fetchBrands()
    if (created?._id) {
      await fetchModels(created._id)
      setVehicleForm((prev) => ({ ...prev, brandId: created._id, modelId: '' }))
    }
    setShowBrandModal(false)
    toast.success('Brand saved successfully')
  }

  const handleCreateModel = async () => {
    if (!session?.accessToken) return
    if (!modelForm.brandId) {
      toast.error('Please select a brand')
      return
    }
    if (!modelForm.name.trim()) {
      toast.error('Please enter a model name')
      return
    }
    const response = await fetch(`${API_BASE_URL}/vehicle-models`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelForm),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      toast.error(err?.message || 'Failed to save model')
      return
    }
    const result = await response.json().catch(() => ({}))
    const created = result?.data?.item || result?.data || result?.item || result?.model || result
    await fetchModels(modelForm.brandId)
    if (created?._id) {
      setVehicleForm((prev) => ({
        ...prev,
        brandId: modelForm.brandId,
        modelId: created._id,
      }))
    }
    setShowModelModal(false)
    toast.success('Model saved successfully')
  }

  const handleCreateYear = async () => {
    if (!session?.accessToken) return
    if (!yearForm.year) {
      toast.error('Please enter a year')
      return
    }
    const payload = { ...yearForm, year: Number(yearForm.year) }
    const response = await fetch(`${API_BASE_URL}/vehicle-years`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      toast.error(err?.message || 'Failed to save year')
      return
    }
    const result = await response.json().catch(() => ({}))
    const created = result?.data?.item || result?.data || result?.item || result?.year || result
    await fetchYears()
    if (created?._id) {
      setVehicleForm((prev) => ({ ...prev, yearId: created._id }))
    }
    setShowYearModal(false)
    toast.success('Year saved successfully')
  }

  const handleSave = async () => {
    if (!session?.accessToken) return
    if (!vehicleForm.brandId || !vehicleForm.modelId || !vehicleForm.yearId) {
      toast.error('Please select brand, model, and year')
      return
    }

    const trimmedVariantName = String(vehicleForm.variantName || '').trim()
    if (!trimmedVariantName) {
      toast.error('Please enter a variant name')
      return
    }

    const attributeValueIds = Object.values(attributeSelections).filter(Boolean)
    if (!attributeValueIds.length) {
      toast.error('Please select at least one variant attribute value')
      return
    }

    // In edit mode, skip API call if nothing changed
    if (editingVehicle && vehicleFormSnapshot && attributeSelectionsSnapshot) {
      const formSame = Object.keys(vehicleFormSnapshot).every(
        key => String(vehicleForm[key] ?? '') === String(vehicleFormSnapshot[key] ?? '')
      )
      const selectionSame =
        JSON.stringify(Object.entries(attributeSelections).sort()) ===
        JSON.stringify(Object.entries(attributeSelectionsSnapshot).sort())
      if (formSame && selectionSame) {
        setShowModal(false)
        return
      }
    }

    const payload = {
      ...vehicleForm,
      variantName: trimmedVariantName,
      attributeValueIds,
    }

    const url = editingVehicle
      ? `${API_BASE_URL}/vehicles/${editingVehicle._id}`
      : `${API_BASE_URL}/vehicles`

    const response = await fetch(url, {
      method: editingVehicle ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      setShowModal(false)
      setEditingVehicle(null)
      setVehicleForm({ brandId: '', modelId: '', yearId: '', variantName: '', status: 'active' })
      setAttributeSelections({})
      fetchVehicles()
      toast.success('Vehicle saved successfully')
    } else {
      const err = await response.json().catch(() => ({}))
      toast.error(err?.message || 'Failed to save vehicle')
    }
  }

  const toggleStatus = async (vehicle) => {
    const nextStatus = vehicle.status === 'active' ? 'inactive' : 'active'
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicle._id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (response.ok) {
      fetchVehicles()
      toast.success('Status updated successfully')
    } else {
      toast.error('Failed to update status')
    }
  }

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'brandId') {
        next.modelId = ''
      }
      return next
    })
    if (key === 'brandId') {
      fetchModels(value)
    }
  }

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>

  return (
    <>
      <PageTItle title="VEHICLE LIST" />
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Form.Select value={filters.brandId} onChange={(e) => updateFilter('brandId', e.target.value)}>
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={filters.modelId} onChange={(e) => updateFilter('modelId', e.target.value)}>
                    <option value="">All Models</option>
                    {models.map((model) => (
                      <option key={model._id} value={model._id}>{model.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={filters.yearId} onChange={(e) => updateFilter('yearId', e.target.value)}>
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year._id} value={year._id}>{year.year}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="text-end">
                  <Button variant="primary" onClick={() => handleOpenModal()}>Add Vehicle</Button>
                </Col>
              </Row>

              <div className="table-responsive">
                <Table hover responsive className="table-nowrap mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Vehicle Code</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Variant Name</th>
                      <th>Model Year</th>
                      <th>Fuel Type</th>
                      <th>Transmission</th>
                      <th>Engine Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((item) => (
                      <tr key={item._id}>
                        <td>{item.vehicleCode || '-'}</td>
                        <td>{item.brand?.name || brandMap.get(item.brandId)?.name || 'N/A'}</td>
                        <td>{item.model?.name || modelMap.get(item.modelId)?.name || 'N/A'}</td>
                        <td className="fw-semibold">{item.variantName || item.display?.variantName || '-'}</td>
                        <td>{item.year?.year || yearMap.get(item.yearId)?.year || '-'}</td>
                        <td>{item.display?.fuelType || '-'}</td>
                        <td>{item.display?.transmission || '-'}</td>
                        <td>{item.display?.engineCapacity || '-'}</td>
                        <td>
                          <span className={`badge px-3 py-2 rounded-pill fs-12 fw-medium ${item.status === 'active'
                            ? 'bg-success-subtle text-success'
                            : 'bg-danger-subtle text-danger'
                            }`}>
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link href={`/vehicles/${item._id}`} className="btn btn-link p-0 text-info" title="View">
                              <IconifyIcon icon="solar:eye-bold" width={20} height={20} />
                            </Link>
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-primary"
                              onClick={() => handleOpenModal(item)}
                              title="Edit"
                            >
                              <IconifyIcon icon="solar:pen-new-square-bold-duotone" width={20} height={20} />
                            </Button>
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-warning"
                              onClick={() => toggleStatus(item)}
                              title={item.status === 'active' ? 'Disable' : 'Enable'}
                            >
                              <IconifyIcon icon="solar:lock-keyhole-bold" width={20} height={20} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vehicles.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center">No vehicles found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="text-muted">Page {page} of {totalPages}</span>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingVehicle ? 'Edit' : 'Add'} Vehicle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center justify-content-between">
                    <span>Brand</span>
                    <Button variant="link" size="sm" className="p-0" onClick={openBrandModal}>
                      + Add Brand
                    </Button>
                  </Form.Label>
                  <Form.Select
                    value={vehicleForm.brandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center justify-content-between">
                    <span>Model</span>
                    <Button variant="link" size="sm" className="p-0" onClick={openModelModal}>
                      + Add Model
                    </Button>
                  </Form.Label>
                  <Form.Select
                    value={vehicleForm.modelId}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, modelId: e.target.value }))}
                  >
                    <option value="">Select model</option>
                    {models.map((model) => (
                      <option key={model._id} value={model._id}>{model.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="d-flex align-items-center justify-content-between">
                    <span>Model Year</span>
                    <Button variant="link" size="sm" className="p-0" onClick={openYearModal}>
                      + Add Year
                    </Button>
                  </Form.Label>
                  <Form.Select
                    value={vehicleForm.yearId}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, yearId: e.target.value }))}
                  >
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option key={year._id} value={year._id}>{year.year}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Variant Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter variant name"
                className="fs-5 fw-semibold"
                value={vehicleForm.variantName}
                onChange={(e) =>
                  setVehicleForm((prev) => ({ ...prev, variantName: e.target.value }))
                }
              />
            </Form.Group>
            <Row>
              {attributes.filter((attribute) => attribute.name !== 'Variant Name').map((attribute) => (
                <Col md={4} key={attribute._id}>
                  <Form.Group className="mb-3">
                    <Form.Label>{attribute.name}</Form.Label>
                    <Form.Select
                      value={attributeSelections[attribute._id] || ''}
                      onChange={(e) =>
                        setAttributeSelections((prev) => ({
                          ...prev,
                          [attribute._id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select {attribute.name}</option>
                      {(attribute.values || []).map((value) => (
                        <option key={value._id} value={value._id}>{value.value}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              ))}
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={vehicleForm.status}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        <Button variant="primary" onClick={handleSave}>Save</Button>
      </Modal.Footer>
    </Modal>

      <VehicleBrandModal
        show={showBrandModal}
        onHide={() => setShowBrandModal(false)}
        form={brandForm}
        setForm={setBrandForm}
        uploading={brandUploading}
        onUpload={handleBrandLogoUpload}
        onSave={handleCreateBrand}
        resolveMediaUrl={resolveMediaUrl}
      />

      <VehicleModelModal
        show={showModelModal}
        onHide={() => setShowModelModal(false)}
        form={modelForm}
        setForm={setModelForm}
        uploading={modelUploading}
        onUpload={handleModelImageUpload}
        onSave={handleCreateModel}
        resolveMediaUrl={resolveMediaUrl}
        brands={brands}
      />

      <VehicleYearModal
        show={showYearModal}
        onHide={() => setShowYearModal(false)}
        form={yearForm}
        setForm={setYearForm}
        onSave={handleCreateYear}
      />
    </>
  )
}

export default VehiclesPage
