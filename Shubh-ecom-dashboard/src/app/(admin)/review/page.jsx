'use client'
import logger from '@/lib/logger'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageTitle from '@/components/PageTitle'
import { getAllReviews } from '@/helpers/data'
import { reviewAPI } from '@/helpers/reviewApi'
import { getRatingStatus } from '@/utils/other'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardFooter, Col, Row, Placeholder, OverlayTrigger, Popover, Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal'

const STATUS_LABELS = {
  published: 'Approved',
  hidden: 'Disapproved',
  spam: 'Spam'
}

const STATUS_VARIANTS = {
  published: 'success',
  hidden: 'secondary',
  spam: 'danger'
}

const REVIEWS_PER_PAGE = 10

const formatUserName = (user) => {
  if (!user) return 'Anonymous'
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return fullName || user.email || 'Anonymous'
}

const formatReviewDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getUserInitial = (user) => {
  const fullName = formatUserName(user)
  const first = fullName?.trim()?.charAt(0)
  return first ? first.toUpperCase() : 'U'
}

const ReviewPage = () => {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [actionId, setActionId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)
  const safeReviews = Array.isArray(reviews) ? reviews : []

  useEffect(() => {
    const fetchReviews = async () => {
      if (session?.accessToken) {
        try {
          const data = await getAllReviews(session.accessToken)
          setReviews(Array.isArray(data) ? data : [])
        } catch (e) {
          logger.error(e)
          toast.error('Failed to load reviews')
        } finally {
          setLoading(false)
        }
      }
    }
    fetchReviews()
  }, [session])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return safeReviews
    return safeReviews.filter((item) => item?.status === statusFilter)
  }, [safeReviews, statusFilter])

  const stats = useMemo(() => {
    const total = safeReviews.length
    const published = safeReviews.filter((item) => item?.status === 'published').length
    const hidden = safeReviews.filter((item) => item?.status === 'hidden').length
    const spam = safeReviews.filter((item) => item?.status === 'spam').length
    return { total, published, hidden, spam }
  }, [safeReviews])

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE))
  const pageStartIndex = (currentPage - 1) * REVIEWS_PER_PAGE
  const paginatedReviews = filteredReviews.slice(pageStartIndex, pageStartIndex + REVIEWS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleUpdateStatus = async (review, status) => {
    if (!review?._id || !session?.accessToken) return
    try {
      setActionId(review._id)
      await reviewAPI.update(review._id, { status }, session.accessToken)
      setReviews(prev =>
        (Array.isArray(prev) ? prev : []).map((item) => (item._id === review._id ? { ...item, status } : item))
      )
      toast.success(`Review marked as ${STATUS_LABELS[status] || status}`)
    } catch (err) {
      logger.error(err)
      toast.error(err?.message || 'Failed to update review')
    } finally {
      setActionId(null)
    }
  }

  const handleDeleteClick = (review) => {
    setReviewToDelete(review)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    const review = reviewToDelete
    if (!review?._id || !session?.accessToken) return

    try {
      setActionId(review._id)
      await reviewAPI.delete(review._id, session.accessToken)
      setReviews(prev => (Array.isArray(prev) ? prev : []).filter((item) => item._id !== review._id))
      toast.success('Review deleted')
      setShowDeleteModal(false)
      setReviewToDelete(null)
    } catch (err) {
      logger.error(err)
      toast.error(err?.message || 'Failed to delete review')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = handleDeleteClick

  if (loading) {
    return (
      <>
        <PageTitle title="REVIEWS" />
        <Row>
          <Col xl={12}>
            <Card>
              <div className="d-flex card-header justify-content-between align-items-center">
                <div className="placeholder-glow w-50">
                  <Placeholder xs={4} className="mb-2" />
                  <Placeholder xs={8} />
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Placeholder.Button key={`filter-skeleton-${idx}`} xs={3} size="sm" />
                  ))}
                </div>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0 table-hover table-centered">
                  <thead className="bg-light-subtle">
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Title & Comment</th>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={`review-skeleton-${idx}`} className="placeholder-glow">
                        <td><Placeholder xs={6} /></td>
                        <td><Placeholder xs={7} /></td>
                        <td><Placeholder xs={10} /></td>
                        <td><Placeholder xs={8} /></td>
                        <td><Placeholder xs={6} /></td>
                        <td><Placeholder xs={5} /></td>
                        <td><Placeholder xs={3} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
        </Row>
      </>
    )
  }

  return (
    <>
      <PageTitle title="REVIEWS" />
      <Row>
        <Col xl={12}>
          <Card>
            <div className="d-flex card-header justify-content-between align-items-center">
              <div>
                <h4 className="card-title mb-1">Customer Reviews</h4>
                <p className="text-muted mb-0">Moderate, approve, or flag customer feedback in one place.</p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { key: 'all', label: `All (${stats.total})` },
                  { key: 'published', label: `Approved (${stats.published})` },
                  { key: 'hidden', label: `Disapproved (${stats.hidden})` },
                  { key: 'spam', label: `Spam (${stats.spam})` }
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={`btn btn-sm ${statusFilter === item.key ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setStatusFilter(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0 table-hover table-centered">
                <thead className="bg-light-subtle">
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Title & Comment</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReviews.map((review) => {
                    const id = review._id || review.id
                    const rating = Number(review?.rating || 0)
                    const user = review?.userId || review?.user
                    const product = review?.productId
                    const createdAt = formatReviewDate(review?.createdAt)
                    const status = review?.status || 'published'
                    return (
                      <tr key={id} className={actionId === id ? 'opacity-75' : undefined}>
                        <td className="text-nowrap">{createdAt}</td>
                        <td className="text-nowrap">
                          {product ? (
                            <Link href={`/products/product-add?id=${product?._id || product?.id}`} className="text-decoration-none fw-medium">
                              {product?.name || 'View Product'}
                            </Link>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td style={{ minWidth: 280 }}>
                          <div className="fw-semibold text-dark">{review?.title || 'Review'}</div>
                          <div className="text-muted small" style={{ maxWidth: 460 }}>
                            {review?.comment || 'No review message provided.'}
                          </div>
                        </td>
                        <td style={{ minWidth: 180 }}>
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm bg-primary-subtle rounded-circle flex-centered flex-shrink-0 me-2">
                              <span className="text-primary fw-bold">{getUserInitial(user)}</span>
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{formatUserName(user)}</div>
                              <div className="text-muted small">{user?.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <ul className="d-flex m-0 fs-16 list-unstyled">
                              {Array.from({ length: 5 }).map((_star, idx) => (
                                <li
                                  className={idx < Math.round(rating) ? 'text-warning' : 'text-muted'}
                                  key={idx}
                                >
                                  <IconifyIcon icon="bxs:star" />
                                </li>
                              ))}
                            </ul>
                            <span className="fw-semibold">{rating.toFixed(1)}</span>
                          </div>
                          <div className="text-muted small">{getRatingStatus(rating)} Quality</div>
                        </td>
                        <td>
                          <span className={`badge bg-${STATUS_VARIANTS[status] || 'secondary'} badge-subtle text-uppercase`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        </td>
                        <td className="text-end">
                          <OverlayTrigger
                            trigger="click"
                            rootClose
                            placement="left"
                            overlay={
                              <Popover id={`review-actions-${id}`}>
                                <Popover.Body className="p-2 d-flex flex-column gap-1">
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2"
                                    disabled={status === 'published'}
                                    onClick={() => handleUpdateStatus(review, 'published')}
                                  >
                                    <IconifyIcon icon="solar:check-circle-bold-duotone" className="text-success" />
                                    Approve
                                  </button>
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2"
                                    disabled={status === 'hidden'}
                                    onClick={() => handleUpdateStatus(review, 'hidden')}
                                  >
                                    <IconifyIcon icon="solar:close-circle-bold-duotone" className="text-secondary" />
                                    Disapprove
                                  </button>
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2"
                                    disabled={status === 'spam'}
                                    onClick={() => handleUpdateStatus(review, 'spam')}
                                  >
                                    <IconifyIcon icon="solar:shield-warning-bold-duotone" className="text-warning" />
                                    Spam
                                  </button>
                                  <button
                                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                                    onClick={() => handleDelete(review)}
                                  >
                                    <IconifyIcon icon="solar:trash-bin-2-bold-duotone" />
                                    Delete
                                  </button>
                                </Popover.Body>
                              </Popover>
                            }
                          >
                            <Button
                              variant="light"
                              size="sm"
                              className="btn btn-light avatar-sm rounded-circle p-0 border-0"
                              disabled={actionId === id}
                            >
                              <IconifyIcon icon="solar:menu-dots-bold" />
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    )
                  })}
                  {paginatedReviews.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted py-4">
                        No reviews found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <CardFooter className="border-top">
              <nav aria-label="Review table pagination">
                <ul className="pagination justify-content-end mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  <li className="page-item active">
                    <span className="page-link">{currentPage}</span>
                  </li>
                  <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </CardFooter>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default ReviewPage
