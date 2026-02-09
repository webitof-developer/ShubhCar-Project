'use client'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageTItle from '@/components/PageTItle'
import { getAllReviews } from '@/helpers/data'
import { reviewAPI } from '@/helpers/reviewApi'
import { getRatingStatus } from '@/utils/other'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardBody, Col, Row, Spinner, Placeholder, OverlayTrigger, Popover, Button } from 'react-bootstrap'
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

const formatUserName = (user) => {
  if (!user) return 'Anonymous'
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return fullName || user.email || 'Anonymous'
}

const ReviewCard = ({ review, onUpdateStatus, onDelete }) => {
  const rating = Number(review?.rating || 0)
  const user = review?.userId || review?.user || null
  const product = review?.productId || null
  const createdAt = review?.createdAt ? new Date(review.createdAt) : null
  const status = review?.status || 'published'

  return (
    <Card className="h-100 border-0 shadow-sm review-card">
      <CardBody className="p-4">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge bg-${STATUS_VARIANTS[status] || 'secondary'} text-uppercase`}>
                {STATUS_LABELS[status] || status}
              </span>
              {createdAt && (
                <span className="text-muted small">{createdAt.toLocaleDateString()}</span>
              )}
            </div>
            <h5 className="mb-1 text-dark fw-semibold">
              {review?.title || 'Review'}
            </h5>
            {product && (
              <div className="text-muted small">
                Product:{' '}
                <Link href={`/products/product-add?id=${product?._id || product?.id}`} className="text-decoration-none">
                  {product?.name || 'View Product'}
                </Link>
              </div>
            )}
          </div>
          <div className="text-end">
            <div className="d-flex align-items-center gap-1 justify-content-end">
              <ul className="d-flex m-0 fs-18 list-unstyled">
                {Array.from({ length: 5 }).map((_star, idx) => (
                  <li
                    className={idx < Math.round(rating) ? 'text-warning' : 'text-muted'}
                    key={idx}
                  >
                    <IconifyIcon icon="bxs:star" />
                  </li>
                ))}
              </ul>
              <span className="fw-semibold text-dark">{rating.toFixed(1)}/5</span>
            </div>
            <div className="text-muted small">{getRatingStatus(rating)} Quality</div>
          </div>
        </div>

        <div className="bg-light rounded-3 p-3 mb-3">
          <div className="text-uppercase text-muted fw-semibold small mb-1">Your Review</div>
          <p className="mb-0 text-dark">
            {review?.comment || 'No review message provided.'}
          </p>
        </div>

        <Row className="g-3 mb-3">
          <Col md={6}>
            <div className="border rounded-3 p-3 h-100">
              <div className="text-uppercase text-muted fw-semibold small mb-2">Customer Details</div>
              <div className="fw-semibold text-dark">{formatUserName(user)}</div>
              <div className="text-muted small">{user?.email || 'No email provided'}</div>
              <div className="text-muted small">{user?.phone || 'No phone provided'}</div>
            </div>
          </Col>
        </Row>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={status === 'published'}
            onClick={() => onUpdateStatus(review, 'published')}
          >
            Approve
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={status === 'hidden'}
            onClick={() => onUpdateStatus(review, 'hidden')}
          >
            Disapprove
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={status === 'spam'}
            onClick={() => onUpdateStatus(review, 'spam')}
          >
            Mark Spam
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => onDelete(review)}
          >
            Delete
          </button>
        </div>
      </CardBody>
    </Card>
  )
}

const ReviewPage = () => {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionId, setActionId] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)

  useEffect(() => {
    const fetchReviews = async () => {
      if (session?.accessToken) {
        try {
          const data = await getAllReviews(session.accessToken)
          setReviews(Array.isArray(data) ? data : [])
        } catch (e) {
          console.error(e)
          toast.error('Failed to load reviews')
        } finally {
          setLoading(false)
        }
      }
    }
    fetchReviews()
  }, [session])

  const filteredReviews = useMemo(() => {
    if (statusFilter === 'all') return reviews
    return reviews.filter((item) => item.status === statusFilter)
  }, [reviews, statusFilter])

  const stats = useMemo(() => {
    const total = reviews.length
    const published = reviews.filter((item) => item.status === 'published').length
    const hidden = reviews.filter((item) => item.status === 'hidden').length
    const spam = reviews.filter((item) => item.status === 'spam').length
    return { total, published, hidden, spam }
  }, [reviews])

  const handleUpdateStatus = async (review, status) => {
    if (!review?._id || !session?.accessToken) return
    try {
      setActionId(review._id)
      await reviewAPI.update(review._id, { status }, session.accessToken)
      setReviews(prev =>
        prev.map((item) => (item._id === review._id ? { ...item, status } : item))
      )
      toast.success(`Review marked as ${STATUS_LABELS[status] || status}`)
    } catch (err) {
      console.error(err)
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
      setReviews(prev => prev.filter((item) => item._id !== review._id))
      toast.success('Review deleted')
      setShowDeleteModal(false)
      setReviewToDelete(null)
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Failed to delete review')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = handleDeleteClick

  if (loading) {
    return (
      <>
        <PageTItle title="REVIEWS" />
        <div className="mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
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
        </div>

        <Row className="g-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Col xl={6} key={`review-skeleton-${idx}`}>
              <Card className="h-100 border-0 shadow-sm review-card">
                <CardBody className="p-4 placeholder-glow">
                  <Placeholder xs={5} className="mb-2" />
                  <Placeholder xs={7} className="mb-3" />
                  <Placeholder xs={12} className="mb-2" />
                  <Placeholder xs={10} className="mb-3" />
                  <Placeholder xs={6} />
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    )
  }

  return (
    <>
      <PageTItle title="REVIEWS" />
      <div className="mb-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h4 className="mb-1">Customer Reviews</h4>
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
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-nowrap align-middle">
          <thead className="table-light">
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
            {filteredReviews.map((review) => {
              const id = review._id || review.id
              const rating = Number(review?.rating || 0)
              const user = review?.userId || review?.user
              const product = review?.productId
              const createdAt = review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : '-'
              const status = review?.status || 'published'
              return (
                <tr key={id} className={actionId === id ? 'opacity-75' : undefined}>
                  <td>{createdAt}</td>
                  <td>
                    {product ? (
                      <Link href={`/products/product-add?id=${product?._id || product?.id}`} className="text-decoration-none">
                        {product?.name || 'View Product'}
                      </Link>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td style={{ minWidth: 280 }}>
                    <div className="fw-semibold text-dark">{review?.title || 'Review'}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: 420 }}>
                      {review?.comment || 'No review message provided.'}
                    </div>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <div className="fw-semibold text-dark">{formatUserName(user)}</div>
                    <div className="text-muted small">{user?.email || 'No email'}</div>
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
                    <span className={`badge bg-${STATUS_VARIANTS[status] || 'secondary'} text-uppercase`}>
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
                              className="dropdown-item   d-flex align-items-center gap-2"
                              disabled={status === 'hidden'}
                              onClick={() => handleUpdateStatus(review, 'hidden')}
                            >
                              <IconifyIcon icon="solar:close-circle-bold-duotone" className="text-secondary" />
                              Disapprove
                            </button>
                            <button
                              className="dropdown-item   d-flex align-items-center gap-2"
                              disabled={status === 'spam'}
                              onClick={() => handleUpdateStatus(review, 'spam')}
                            >
                              <IconifyIcon icon="solar:shield-warning-bold-duotone" className="text-warning" />
                              Spam
                            </button>
                            <button
                              className="dropdown-item   d-flex align-items-center gap-2 text-danger"
                              onClick={() => handleDelete(review)}
                            >
                              <IconifyIcon icon="solar:trash-bin-2-bold-duotone" />
                              Delete
                            </button>
                          </Popover.Body>
                        </Popover>
                      }
                    >
                      <Button variant="light" size="sm" className="border">
                        <IconifyIcon icon="solar:menu-dots-bold" />
                      </Button>
                    </OverlayTrigger>
                  </td>
                </tr>
              )
            })}
            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
export default ReviewPage
