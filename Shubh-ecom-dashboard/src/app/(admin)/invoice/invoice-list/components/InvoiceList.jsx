'use client'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { currency } from '@/context/constants'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardBody, CardFooter, CardTitle, Col, Row, Spinner, Alert } from 'react-bootstrap'
import { invoiceAPI } from '@/helpers/invoiceApi'

const DOCUMENT_TABS = [
  { key: 'all', label: 'All Documents' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'credit_note', label: 'Credit Notes' },
]

const InvoiceList = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [invoices, setInvoices] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [documentType, setDocumentType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchInput.trim()
      setSearchQuery((prev) => {
        if (prev === nextQuery) return prev
        setPage(1)
        return nextQuery
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = {
        page,
        limit: 20,
      }
      if (documentType !== 'all') {
        params.type = documentType
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const response = await invoiceAPI.list(params, session.accessToken)
      const payload = response.data || response
      const list = payload.invoices || payload.data || []
      const pagination = payload.pagination || {}
      setInvoices(list)
      setTotalPages(pagination.pages || 1)
    } catch (err) {
      setError(err.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [documentType, page, searchQuery, session?.accessToken])

  useEffect(() => {
    if (session?.accessToken) {
      fetchInvoices()
    }
  }, [fetchInvoices, session])

  const buildViewerUrl = (invoiceId, type, action = 'view') => {
    const params = new URLSearchParams({
      id: invoiceId,
      documentType: type || 'invoice',
      source: 'invoice_list',
    })

    if (action !== 'view') {
      params.set('action', action)
    }

    return `/invoice/invoice-details?${params.toString()}`
  }

  const handleView = (invoiceId, type) => {
    window.open(buildViewerUrl(invoiceId, type), '_blank')
  }

  const handleDownload = (invoiceId, type) => {
    window.open(buildViewerUrl(invoiceId, type, 'download'), '_blank')
  }

  const handlePrint = (invoiceId, type) => {
    window.open(buildViewerUrl(invoiceId, type, 'print'), '_blank')
  }

  const handleTabChange = (type) => {
    setDocumentType(type)
    setPage(1)
  }

  const getDocumentLabel = (type) => (type === 'credit_note' ? 'Credit Note' : 'Invoice')
  const getStatusLabel = (status) =>
    String(status || 'issued')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (match) => match.toUpperCase())
  const hasActiveSearch = searchInput.trim().length > 0
  const isSearchActive = searchFocused || hasActiveSearch || !!searchQuery

  return (
    <Row>
      <Col xl={12}>
        <Card>
          <div className="card-header">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <CardTitle as={'h4'} className="mb-0">Invoices</CardTitle>
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                {DOCUMENT_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`btn btn-sm ${documentType === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleTabChange(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="ms-auto" style={{ minWidth: '280px', maxWidth: '460px', width: '100%' }}>
                <div
                  className="d-flex align-items-center rounded-pill bg-body border px-2"
                  onFocusCapture={() => setSearchFocused(true)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setSearchFocused(false)
                    }
                  }}
                  aria-label="Invoice search container"
                  style={{
                    minHeight: '42px',
                    borderColor: isSearchActive ? 'rgba(13, 110, 253, 0.25)' : 'var(--bs-border-color)',
                    boxShadow: isSearchActive
                      ? '0 0 0 2px rgba(13, 110, 253, 0.12)'
                      : '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
                    transition: 'border-color 160ms ease, box-shadow 160ms ease',
                  }}
                >
                  <input
                    type="search"
                    className="form-control border-0 bg-transparent shadow-none fs-6 px-2 py-0"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    aria-label="Search invoices"
                  />
                  <button
                    type="button"
                    className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => hasActiveSearch && setSearchInput(searchInput)}
                    aria-label="Search"
                  >
                    <IconifyIcon icon="bx:search" className="fs-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2 d-flex flex-wrap align-items-center gap-2">
              {searchQuery && (
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    Search: {searchQuery}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs"
                    onClick={() => setSearchInput('')}
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
          </div>
          <CardBody className="p-0">
            {error && <Alert variant="danger" className="m-3">{error}</Alert>}
            <div
              className="table-responsive px-3"
              style={{
                maxHeight: '65vh',
                overflowY: 'auto',
              }}
            >
              <table className="table align-middle mb-0 table-hover table-centered">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-3">Invoice</th>
                    <th>Type</th>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <Spinner animation="border" />
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No {documentType === 'all' ? 'documents' : documentType === 'credit_note' ? 'credit notes' : 'invoices'} found
                        {searchQuery ? ` for "${searchQuery}"` : ''}
                      </td>
                    </tr>
                  ) : (
                    invoices.map((item) => (
                      <tr key={item._id}>
                        <td className="ps-3">
                          <Link href="#" className="text-body">
                            {item.invoiceNumber || item._id?.slice(0, 6)}
                          </Link>
                        </td>
                        <td>
                          <span className={`badge py-1 px-2 ${item.type === 'credit_note' ? 'bg-info-subtle text-info' : 'bg-primary-subtle text-primary'}`}>
                            {getDocumentLabel(item.type)}
                          </span>
                        </td>
                        <td>{item.orderSnapshot?.orderNumber || '-'}</td>
                        <td>{item.customerSnapshot?.name || '-'}</td>
                        <td>{item.issuedAt ? new Date(item.issuedAt).toLocaleDateString('en-IN') : '-'}</td>
                        <td>{currency}{item.totals?.grandTotal ?? 0}</td>
                        <td>
                          <span className={`badge py-1 px-2 ${item.status === 'voided' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button className="btn btn-light btn-sm" onClick={() => handleView(item._id, item.type)}>
                              <IconifyIcon icon="solar:eye-broken" className="align-middle fs-18" />
                            </button>
                            <button className="btn btn-soft-primary btn-sm" onClick={() => handleDownload(item._id, item.type)}>
                              <IconifyIcon icon="solar:download-broken" className="align-middle fs-18" />
                            </button>
                            <button className="btn btn-soft-secondary btn-sm" onClick={() => handlePrint(item._id, item.type)}>
                              <IconifyIcon icon="solar:printer-broken" className="align-middle fs-18" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
          {!loading && totalPages > 1 && (
            <CardFooter className="border-top">
              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-end mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                      Previous
                    </button>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">{page}</span>
                  </li>
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </CardFooter>
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default InvoiceList
