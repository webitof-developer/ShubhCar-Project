'use client'

import logger from '@/lib/logger'
import PageTitle from '@/components/PageTitle'
import { activityLogsApi } from '@/helpers/activityLogsApi'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Placeholder,
  Row,
  Spinner,
} from 'react-bootstrap'

const DEFAULT_FILTERS = {
  search: '',
  userId: '',
  resource: '',
  action: '',
  severity: '',
  from: '',
  to: '',
}

const ACTION_BADGE = {
  create: 'success',
  update: 'primary',
  delete: 'danger',
  status_change: 'warning',
  change: 'warning',
  cancel: 'warning',
  refund: 'secondary',
  approve: 'success',
  reject: 'danger',
}

const SEVERITY_BADGE = {
  info: 'secondary',
  warning: 'warning',
  error: 'danger',
  critical: 'dark',
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatUserLabel = (actor) => {
  if (!actor) return 'Unknown'
  const name = String(actor.name || '').trim()
  const email = String(actor.email || '').trim()
  return name || email || 'Unknown'
}

const isMongoId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''))
const MONGO_ID_REGEX = /\b[a-f0-9]{24}\b/gi

const formatResourceTarget = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  if (isMongoId(raw)) {
    return '-'
  }
  return raw
}

const getVisibleTarget = (item) => {
  const display = String(item?.targetDisplay || '').trim()
  if (display) return display
  return formatResourceTarget(item?.resourceId)
}

const getCopyableTarget = (item) => {
  const display = String(item?.targetDisplay || '').trim()
  if (display) return display
  const resourceId = String(item?.resourceId || '').trim()
  if (resourceId && !isMongoId(resourceId)) return resourceId
  return ''
}

const sanitizeMongoText = (value) => {
  const raw = String(value || '')
  return raw.replace(MONGO_ID_REGEX, '[internal-id]')
}

const sanitizeForDisplay = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForDisplay(entry))
  }
  if (value && typeof value === 'object') {
    const next = {}
    Object.entries(value).forEach(([key, entry]) => {
      next[key] = sanitizeForDisplay(entry)
    })
    return next
  }
  return typeof value === 'string' ? sanitizeMongoText(value) : value
}

const getDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ActivityPage = () => {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    uniqueUsers: 0,
    failures: 0,
    filters: { resources: [], actions: [], severities: [], users: [] },
  })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [viewMode, setViewMode] = useState('table')
  const [selectedItem, setSelectedItem] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const isAdmin = String(session?.user?.role || '').toLowerCase() === 'admin'

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
      page,
      limit,
    }),
    [filters, debouncedSearch, page, limit],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(String(filters.search || '').trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [filters.search])

  const fetchLogs = async () => {
    if (!session?.accessToken || !isAdmin) return
    try {
      setLoading(true)
      setError('')
      const response = await activityLogsApi.list(queryParams, session.accessToken)
      const payload = response?.data || response || {}
      setRows(Array.isArray(payload.data) ? payload.data : [])
      setSummary(payload.summary || summary)
      setPagination(payload.pagination || pagination)
    } catch (err) {
      logger.error('Failed to fetch activity logs', err)
      setError(err?.message || 'Failed to fetch activity logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    fetchLogs()
  }, [status, session?.accessToken, isAdmin, queryParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setDebouncedSearch('')
    setPage(1)
    setLimit(20)
  }

  const applyQuickRange = (days) => {
    const today = new Date()
    const fromDate = new Date()
    fromDate.setDate(today.getDate() - (days - 1))
    setFilters((prev) => ({
      ...prev,
      from: getDateInputValue(fromDate),
      to: getDateInputValue(today),
    }))
    setPage(1)
  }

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(String(value || ''))
    } catch (err) {
      logger.error('Clipboard copy failed', err)
    }
  }

  useEffect(() => {
    if (!selectedItem) {
      setShowTechnicalDetails(false)
    }
  }, [selectedItem])

  if (status === 'loading') {
    return (
      <>
        <PageTitle title="ACTIVITY LOG" />
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <PageTitle title="ACTIVITY LOG" />
        <Alert variant="warning">You do not have permission to view this page.</Alert>
      </>
    )
  }

  return (
    <>
      <PageTitle title="ACTIVITY LOG" />

      <Row className="g-3 mb-3">
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 bg-light-subtle">
            <Card.Body className="d-flex align-items-center justify-content-start px-3 py-3 gap-2" style={{ minHeight: 92 }}>
              <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                <IconifyIcon icon="solar:clipboard-text-bold-duotone" />
              </div>
              <div className="text-start">
                <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>Total Activities</div>
                <h4 className="mb-0 fw-semibold text-dark mt-1" style={{ lineHeight: 1.1 }}>{summary.total || 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 bg-light-subtle">
            <Card.Body className="d-flex align-items-center justify-content-start px-3 py-3 gap-2" style={{ minHeight: 92 }}>
              <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                <IconifyIcon icon="solar:calendar-mark-bold-duotone" />
              </div>
              <div className="text-start">
                <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>Today</div>
                <h4 className="mb-0 fw-semibold text-dark mt-1" style={{ lineHeight: 1.1 }}>{summary.today || 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 bg-light-subtle">
            <Card.Body className="d-flex align-items-center justify-content-start px-3 py-3 gap-2" style={{ minHeight: 92 }}>
              <div className="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" />
              </div>
              <div className="text-start">
                <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>Unique Users</div>
                <h4 className="mb-0 fw-semibold text-dark mt-1" style={{ lineHeight: 1.1 }}>{summary.uniqueUsers || 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm h-100 bg-light-subtle">
            <Card.Body className="d-flex align-items-center justify-content-start px-3 py-3 gap-2" style={{ minHeight: 92 }}>
              <div className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                <IconifyIcon icon="solar:danger-triangle-bold-duotone" />
              </div>
              <div className="text-start">
                <div className="text-muted fw-medium" style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>Failed / Error</div>
                <h4 className="mb-0 fw-semibold text-dark mt-1" style={{ lineHeight: 1.1 }}>{summary.failures || 0}</h4>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4} lg={3}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="User, message, resource id"
              />
            </Col>
            <Col md={4} lg={2}>
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </Col>
            <Col md={4} lg={2}>
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </Col>
            <Col md={4} lg={2}>
              <Form.Label>User</Form.Label>
              <Form.Select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <option value="">All Users</option>
                {(summary.filters?.users || []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {(user.name || user.email || user.id).slice(0, 80)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={1}>
              <Form.Label>Resource</Form.Label>
              <Form.Select
                value={filters.resource}
                onChange={(e) => handleFilterChange('resource', e.target.value)}
              >
                <option value="">All</option>
                {(summary.filters?.resources || []).map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={1}>
              <Form.Label>Action</Form.Label>
              <Form.Select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All</option>
                {(summary.filters?.actions || []).map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={1}>
              <Form.Label>Severity</Form.Label>
              <Form.Select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <option value="">All</option>
                {(summary.filters?.severities || []).map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} lg={2}>
              <div className="d-flex gap-2">
                <Button variant={viewMode === 'table' ? 'primary' : 'outline-primary'} onClick={() => setViewMode('table')}>
                  Table
                </Button>
                <Button variant={viewMode === 'timeline' ? 'primary' : 'outline-primary'} onClick={() => setViewMode('timeline')}>
                  Timeline
                </Button>
                <Button variant="light" onClick={handleReset}>Reset</Button>
              </div>
            </Col>
          </Row>
          <Row className="g-2 mt-1">
            <Col>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="small text-muted">Quick range:</span>
                <Button size="sm" variant="outline-secondary" onClick={() => applyQuickRange(1)}>Today</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => applyQuickRange(7)}>Last 7 Days</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => applyQuickRange(30)}>Last 30 Days</Button>
                <Button
                  size="sm"
                  variant="link"
                  className="text-decoration-none px-1"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, from: '', to: '' }))
                    setPage(1)
                  }}
                >
                  Clear dates
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error ? (
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <Button size="sm" variant="outline-danger" onClick={fetchLogs}>Retry</Button>
        </Alert>
      ) : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="placeholder-glow">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Placeholder key={`activity-skeleton-${idx}`} xs={12} className="mb-2" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-muted text-center py-4">No activity found for selected filters.</div>
          ) : viewMode === 'table' ? (
            <div className="table-responsive">
              <table className="table align-middle table-hover mb-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Severity</th>
                    <th>Resource</th>
                    <th>Target</th>
                    <th>Message</th>
                    <th>IP</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item._id}>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>
                        <div className="fw-semibold">{formatUserLabel(item.actor)}</div>
                        <div className="text-muted small">{item.actor?.email || '-'}</div>
                      </td>
                      <td>
                        <Badge bg={ACTION_BADGE[item.action] || 'secondary'}>
                          {item.action || '-'}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={SEVERITY_BADGE[item.severity] || 'secondary'}>
                          {item.severity || 'info'}
                        </Badge>
                      </td>
                      <td>{item.resource || '-'}</td>
                      <td className="text-break">
                        <div className="d-flex align-items-center gap-2">
                          <span>{getVisibleTarget(item)}</span>
                          {getCopyableTarget(item) ? (
                            <Button
                              size="sm"
                              variant="link"
                              className="p-0 text-muted"
                              title="Copy target"
                              onClick={() => handleCopy(getCopyableTarget(item))}
                            >
                              <IconifyIcon icon="solar:copy-bold" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                      <td className="text-break">{sanitizeMongoText(item.message || '-')}</td>
                      <td>{item.requestContext?.ip || '-'}</td>
                      <td className="text-end">
                        <Button size="sm" variant="light" onClick={() => setSelectedItem(item)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {rows.map((item) => (
                <Card key={item._id} className="border shadow-none bg-light-subtle">
                  <Card.Body className="py-2">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div>
                        <div className="fw-semibold">{formatUserLabel(item.actor)}</div>
                        <div className="small text-muted">{formatDateTime(item.createdAt)}</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={ACTION_BADGE[item.action] || 'secondary'}>{item.action || '-'}</Badge>
                        <Badge bg={SEVERITY_BADGE[item.severity] || 'secondary'}>{item.severity || 'info'}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-muted small">
                      <span className="fw-semibold text-dark">{item.resource || '-'}</span>
                      {item.resourceId || item.targetDisplay ? ` (${getVisibleTarget(item)})` : ''} - {sanitizeMongoText(item.message || '-')}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Rows per page</span>
          <Form.Select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            style={{ width: 90 }}
          >
            {[10, 20, 50].map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </Form.Select>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={!pagination?.hasPrevPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </Button>
          <span className="small text-muted">
            Page {pagination?.page || page} of {pagination?.totalPages || 1}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={!pagination?.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Modal show={Boolean(selectedItem)} onHide={() => setSelectedItem(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Activity Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem ? (
            <div className="d-flex flex-column gap-3">
              <div><strong>Time:</strong> {formatDateTime(selectedItem.createdAt)}</div>
              <div><strong>User:</strong> {formatUserLabel(selectedItem.actor)} ({selectedItem.actor?.email || '-'})</div>
              <div><strong>Action:</strong> {selectedItem.action || '-'} | <strong>Severity:</strong> {selectedItem.severity || 'info'}</div>
              <div>
                <strong>Resource:</strong> {selectedItem.resource || '-'}{' '}
                {selectedItem.resourceId || selectedItem.targetDisplay ? `(${getVisibleTarget(selectedItem)})` : ''}
              </div>
              <div><strong>Message:</strong> {sanitizeMongoText(selectedItem.message || '-')}</div>
              <div>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setShowTechnicalDetails((prev) => !prev)}
                >
                  {showTechnicalDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                </Button>
              </div>
              {showTechnicalDetails ? (
                <>
                  <div>
                    <strong>Request Context</strong>
                    <pre className="bg-light p-2 rounded mt-2 mb-0" style={{ maxHeight: 180, overflow: 'auto' }}>
                      {JSON.stringify(sanitizeForDisplay(selectedItem.requestContext || {}), null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>Metadata</strong>
                    <pre className="bg-light p-2 rounded mt-2 mb-0" style={{ maxHeight: 280, overflow: 'auto' }}>
                      {JSON.stringify(sanitizeForDisplay(selectedItem.metadata || {}), null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
    </>
  )
}

export default ActivityPage
