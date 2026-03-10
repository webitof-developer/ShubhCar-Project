'use client'
import logger from '@/lib/logger'
import PageTitle from '@/components/PageTitle'
import { Card, CardBody, Col, Row, Spinner, Table, Button } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/helpers/apiBase'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

const GENERATION_ATTRIBUTE_KEYS = new Set([
  'generation',
  'generation / variant',
  'generation-variant',
  'generation variant',
])

const normalizeName = (value = '') => String(value).trim().toLowerCase()

const getGenerationValue = (vehicle) => {
  const fromDisplay = String(vehicle?.display?.generation || '').trim()
  if (fromDisplay) return fromDisplay
  const fromAttribute = (vehicle?.attributes || []).find((item) =>
    GENERATION_ATTRIBUTE_KEYS.has(normalizeName(item?.attributeName)),
  )
  return String(fromAttribute?.value || '').trim()
}

const VehicleDetailPage = () => {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchDetail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${params.id}/detail`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      })
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setDetail(data)
      }
    } catch (error) {
      logger.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.accessToken && params?.id) {
      fetchDetail()
    } else {
      setLoading(false)
    }
  }, [session, params])

  const toggleStatus = async (vehicleId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (response.ok) {
      fetchDetail()
      toast.success('Status updated successfully')
    } else {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>

  if (!detail) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Vehicle not found.</p>
        <Button variant="secondary" onClick={() => router.push('/vehicles')}>Back to Vehicles</Button>
      </div>
    )
  }

  return (
    <>
      <PageTitle title="VEHICLE DETAIL" />
      <Row className="mb-3">
        <Col xs={12}>
          <Card>
            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{detail.master?.brand?.name || 'Brand'} {detail.master?.model?.name || 'Model'}</h5>
                  <div className="text-muted">Vehicle variants grouped by year</div>
                </div>
                <Button variant="secondary" onClick={() => router.push('/vehicles')}>Back</Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {detail.variantsByYear?.map((group) => (
        <Row key={group.yearId} className="mb-3">
          <Col xs={12}>
            <Card>
              <CardBody>
                <h5 className="mb-3">Model Year: {group.year || '-'}</h5>
                <div className="table-responsive border rounded-3" style={{ maxHeight: '65vh', overflow: 'auto' }}>
                  <Table hover responsive className="table-nowrap mb-0 align-middle">
                    <thead className="position-sticky top-0" style={{ zIndex: 2 }}>
                      <tr>
                        <th className="bg-white">Variant Name</th>
                        <th className="bg-white">Modification Group</th>
                        <th className="bg-white">Fuel Type</th>
                        <th className="bg-white">Transmission</th>
                        <th className="bg-white">Engine Capacity</th>
                        <th className="bg-white">Status</th>
                        <th className="bg-white">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.variants.map((variant) => (
                        <tr key={variant._id}>
                          <td className="fw-semibold">{variant.variantName || variant.display?.variantName || '-'}</td>
                          <td>
                            {getGenerationValue(variant) ? (
                              <span className="badge bg-primary-subtle text-primary fw-medium">
                                {getGenerationValue(variant)}
                              </span>
                            ) : (
                              <span
                                className={`badge fw-medium ${variant.status === 'active'
                                  ? 'bg-danger-subtle text-danger'
                                  : 'bg-warning-subtle text-warning'
                                  }`}
                              >
                                Missing Generation
                              </span>
                            )}
                          </td>
                          <td>{variant.display?.fuelType || '-'}</td>
                          <td>{variant.display?.transmission || '-'}</td>
                          <td>{variant.display?.engineCapacity || '-'}</td>
                          <td>
                            <span className={`badge px-3 py-2 rounded-pill fs-12 fw-medium ${variant.status === 'active'
                              ? 'bg-success-subtle text-success'
                              : 'bg-danger-subtle text-danger'
                              }`}>
                              {variant.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-warning"
                              onClick={() => toggleStatus(variant._id, variant.status)}
                              title={variant.status === 'active' ? 'Disable' : 'Enable'}
                            >
                              <IconifyIcon icon="solar:lock-keyhole-bold" width={20} height={20} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {group.variants.length === 0 && (
                        <tr><td colSpan="7" className="text-center">No variants</td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      ))}
    </>
  )
}

export default VehicleDetailPage
