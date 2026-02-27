'use client'
import logger from '@/lib/logger'

import { userAPI } from '@/helpers/userApi'
import { useEffect, useState } from 'react'
import { Button, Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import Select from 'react-select'
import Flatpickr from 'react-flatpickr'
import { useSession } from 'next-auth/react'
import IconifyIcon from '@/components/wrappers/IconifyIcon'

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const SalespersonFilter = ({ filters, onChange, onReset }) => {
  const { data: session } = useSession()
  const [salesmen, setSalesmen] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSalesmen = async () => {
      if (!session?.accessToken) return
      try {
        setLoading(true)
        const response = await userAPI.adminList({ role: 'salesman', limit: 100 }, session.accessToken)
        const data = extractItems(response?.data || response)
        const options = (Array.isArray(data) ? data : []).map((user) => ({
          value: user._id,
          label: `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim(),
        }))
        setSalesmen(options)
      } catch (error) {
        logger.error('Failed to fetch salesmen', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesmen()
  }, [session])

  const handleDateChange = (dates, field) => {
    if (dates && dates[0]) {
      const dateStr = dates[0].toISOString().split('T')[0]
      onChange({ ...filters, [field]: dateStr, page: 1 })
    } else {
      onChange({ ...filters, [field]: '', page: 1 })
    }
  }

  return (
    <Card className="mb-4 border-0 shadow-sm">
      <CardBody className="p-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="avatar-sm flex-shrink-0">
            <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-4">
              <IconifyIcon icon="solar:filter-bold-duotone" />
            </span>
          </div>
          <h5 className="mb-0">Analytics Filters</h5>
        </div>
        <Row className="g-3">
          <Col md={4}>
            <Form.Label className="fw-semibold text-muted small text-uppercase">Salesperson</Form.Label>
            <Select
              classNamePrefix="react-select"
              options={salesmen}
              isLoading={loading}
              placeholder={loading ? 'Loading...' : 'Select Salesperson'}
              value={salesmen.find((s) => s.value === filters.salesmanId) || null}
              onChange={(option) => onChange({ ...filters, salesmanId: option?.value || '', page: 1 })}
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#e2e8f0',
                  padding: '2px',
                  borderRadius: '0.5rem',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                  },
                }),
              }}
            />
          </Col>
          <Col md={3}>
            <Form.Label className="fw-semibold text-muted small text-uppercase">From Date</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <IconifyIcon icon="solar:calendar-date-bold-duotone" />
              </span>
              <Flatpickr
                className="form-control border-start-0 ps-2"
                placeholder="Select start date"
                value={filters.from}
                onChange={(dates) => handleDateChange(dates, 'from')}
                options={{ dateFormat: 'Y-m-d' }}
              />
            </div>
          </Col>
          <Col md={3}>
            <Form.Label className="fw-semibold text-muted small text-uppercase">To Date</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <IconifyIcon icon="solar:calendar-date-bold-duotone" />
              </span>
              <Flatpickr
                className="form-control border-start-0 ps-2"
                placeholder="Select end date"
                value={filters.to}
                onChange={(dates) => handleDateChange(dates, 'to')}
                options={{ dateFormat: 'Y-m-d' }}
              />
            </div>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button
              variant="light-danger"
              className="w-100 d-flex align-items-center justify-content-center gap-2 bg-soft-danger text-danger border-0"
              onClick={onReset}
              style={{ height: '42px' }}>
              <IconifyIcon icon="solar:restart-bold-duotone" />
              Reset
            </Button>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default SalespersonFilter
